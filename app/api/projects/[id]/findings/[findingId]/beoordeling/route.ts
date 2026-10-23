import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { herberekenCriteriumOordeel } from '@/lib/criterion-assessment';
import { haalBevindingUitGebieden, herzieGebiedenNaAfwijzing } from '@/lib/gebied-koppeling';
import { kenBevindingCodeToe } from '@/lib/finding-code';

/**
 * De beoordeling van een voorstel: één handeling, drie uitgangen.
 *
 *   akkoord     -> het voorstel wordt een bevinding en telt voortaan mee
 *   afwijzen    -> blijft bewaard met de reden, zodat een volgende auditronde
 *                  dezelfde onterechte vondst niet opnieuw voorstelt
 *   doorzetten  -> geen contentbevinding maar een platformgebrek: er wordt een
 *                  technisch issue aangemaakt en het voorstel wordt afgewezen
 *                  met een verwijzing daarheen
 *
 * Eén route en niet drie, omdat het één beslissing is met drie uitkomsten.
 * Zie docs/adr/0001-akkoord-als-poort.md.
 */

type Actie = 'akkoord' | 'afwijzen' | 'doorzetten';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; findingId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const actie: Actie = body.actie;

    if (!['akkoord', 'afwijzen', 'doorzetten'].includes(actie)) {
      return NextResponse.json(
        { error: "actie moet 'akkoord', 'afwijzen' of 'doorzetten' zijn" },
        { status: 400 }
      );
    }

    const finding = await prisma.finding.findUnique({
      where: { id: params.findingId },
      include: { wcagCriterion: { select: { id: true, code: true, titleNl: true } } },
    });

    if (!finding || finding.projectId !== params.id) {
      return NextResponse.json({ error: 'Bevinding niet gevonden' }, { status: 404 });
    }

    if (finding.status !== 'voorstel') {
      return NextResponse.json(
        {
          error: 'Alleen een voorstel kan beoordeeld worden',
          huidigeStatus: finding.status,
        },
        { status: 409 }
      );
    }

    // Afwijzen vraagt om een reden: zonder reden is de afwijzing niets waard,
    // want dan kan de volgende auditronde er niets mee en komt dezelfde
    // onterechte vondst gewoon terug.
    //
    // Bij doorzetten is dat anders. Daar vertelt de verwijzing naar het
    // technische issue het verhaal al — wat er mis is en wie het oplost. Een
    // reden mag, maar verplicht stellen levert vooral plichtmatige tekst op; hij
    // wordt hieronder anders zelf samengesteld.
    const reden: string | undefined = body.reden?.trim() || undefined;
    if (actie === 'afwijzen' && !reden) {
      return NextResponse.json(
        { error: 'Bij afwijzen is een reden verplicht' },
        { status: 400 }
      );
    }

    if (actie === 'akkoord') {
      // Bevinding of opmerking is het oordeel van de ONDERZOEKER, niet iets dat
      // uit de techniek volgt — zie lib/finding-classification.ts. De agent doet
      // een voorstel; bij het akkoord mag dat worden omgezet.
      //
      // Een te strenge afkeuring valt op bij het nalezen, een te milde opmerking
      // glijdt erdoorheen. Daarom kan het bij elk voorstel, niet alleen waar de
      // agent twijfel meldt: die twijfel is bij V004 juist niet gemeld.
      const gevraagdType: string | undefined = body.type;
      if (gevraagdType && gevraagdType !== 'bevinding' && gevraagdType !== 'opmerking') {
        return NextResponse.json(
          { error: "type moet 'bevinding' of 'opmerking' zijn" },
          { status: 400 }
        );
      }
      const nieuwType = (gevraagdType ?? finding.type) as 'bevinding' | 'opmerking';

      const findingCode = await kenBevindingCodeToe(params.id, finding.id);
      const bijgewerkt = await prisma.finding.update({
        where: { id: finding.id },
        data: {
          status: 'open',
          akkoordOp: new Date(),
          type: nieuwType,
          // Een opmerking heeft geen ernst en geen adressant; die velden horen
          // leeg te zijn zodra het er een wordt.
          ...(nieuwType === 'opmerking' ? { impact: null, responsibility: null } : {}),
        },
        include: { wcagCriterion: true, occurrences: true },
      });
      const oordeel = await herberekenCriteriumOordeel(params.id, finding.wcagCriterionId);
      return NextResponse.json({
        finding: bijgewerkt,
        findingCode,
        typeGewijzigd: nieuwType !== finding.type,
        criteriumOordeel: oordeel,
      });
    }

    if (actie === 'afwijzen') {
      const bijgewerkt = await prisma.finding.update({
        where: { id: finding.id },
        data: { status: 'afgewezen', afwijzingsreden: reden },
        include: { wcagCriterion: true, occurrences: true },
      });
      // Afwijzen zegt dat er geen overtreding is: het gebied waar het voorstel onder hing
      // gaat naar ok, en het paginaoordeel naar voldoet als er verder niets afkeurt. Zie
      // lib/gebied-koppeling.ts. Daarna nog de koppelingen opruimen die dat liet staan.
      const herzien = await herzieGebiedenNaAfwijzing(
        finding.id,
        params.id,
        finding.wcagCriterionId,
        reden!
      );
      await haalBevindingUitGebieden(finding.id, params.id, finding.wcagCriterionId);
      // Ook na een afwijzing herberekenen: het voorstel telde niet mee, maar de
      // regel hoort op één plek te blijven en is hier goedkoop.
      const oordeel = await herberekenCriteriumOordeel(params.id, finding.wcagCriterionId);
      return NextResponse.json({ finding: bijgewerkt, criteriumOordeel: oordeel, herzien });
    }

    // doorzetten — het voorstel gaat naar de leverancier in plaats van de redactie.
    // Een technisch issue heeft geen projectkoppeling; het geldt voor het platform.
    // Bestaat er al een issue op ditzelfde criterium met dezelfde titel, dan wordt
    // dat hergebruikt in plaats van een duplicaat aangemaakt.
    const titel: string =
      body.titel?.trim() ||
      `${finding.wcagCriterion?.code ?? ''} — ${finding.wcagCriterion?.titleNl ?? 'Technisch issue'}`.trim();

    let issue = await prisma.technicalIssue.findFirst({
      where: { title: titel, wcagCriterionId: finding.wcagCriterionId },
    });

    // Onthouden of het issue al bestond. Tot 2026-10-23 werd dat achteraf afgeleid
    // uit createdAt < updatedAt van het voorstel, en dat is bij een vers issue ook
    // waar: het wordt aangemaakt vlak vóórdat het voorstel wordt bijgewerkt.
    const hergebruikt = issue !== null;

    if (!issue) {
      issue = await prisma.technicalIssue.create({
        data: {
          title: titel,
          description: finding.description,
          // Het advies aan de redactie wordt het verzoek aan de leverancier.
          request: finding.advice || null,
          wcagCriterionId: finding.wcagCriterionId,
          impact: finding.impact,
          supplier: body.supplier?.trim() || null,
        },
      });
    }

    const bijgewerkt = await prisma.finding.update({
      where: { id: finding.id },
      data: {
        status: 'afgewezen',
        afwijzingsreden: reden ?? `Doorgezet naar technisch issue: ${issue.title}`,
        technicalIssueId: issue.id,
      },
      include: { wcagCriterion: true, occurrences: true },
    });

    // Doorgezet is ook geen contentbevinding: het paginaoordeel beweegt mee, net als bij
    // afwijzen. Op NIS-01 bleef 4.1.2 op Apotheek Botlek anders "afgekeurd" zonder dat er
    // nog een afkeuring onder hing, en kreeg het criterium geen oordeel.
    const herzien = await herzieGebiedenNaAfwijzing(
      finding.id,
      params.id,
      finding.wcagCriterionId,
      bijgewerkt.afwijzingsreden ?? `Doorgezet naar technisch issue: ${issue.title}`
    );
    await haalBevindingUitGebieden(finding.id, params.id, finding.wcagCriterionId);

    const oordeel = await herberekenCriteriumOordeel(params.id, finding.wcagCriterionId);

    return NextResponse.json({
      finding: bijgewerkt,
      herzien,
      technicalIssue: issue,
      hergebruikt,
      criteriumOordeel: oordeel,
    });
  } catch (error: any) {
    console.error('Fout bij beoordelen van voorstel:', error);
    return NextResponse.json(
      { error: 'Beoordelen mislukt', details: error?.message },
      { status: 500 }
    );
  }
}
