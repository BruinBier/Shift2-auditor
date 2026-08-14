import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { herberekenCriteriumOordeel } from '@/lib/criterion-assessment';
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
      const findingCode = await kenBevindingCodeToe(params.id, finding.id);
      const bijgewerkt = await prisma.finding.update({
        where: { id: finding.id },
        data: { status: 'open', akkoordOp: new Date() },
        include: { wcagCriterion: true, occurrences: true },
      });
      const oordeel = await herberekenCriteriumOordeel(params.id, finding.wcagCriterionId);
      return NextResponse.json({ finding: bijgewerkt, findingCode, criteriumOordeel: oordeel });
    }

    if (actie === 'afwijzen') {
      const bijgewerkt = await prisma.finding.update({
        where: { id: finding.id },
        data: { status: 'afgewezen', afwijzingsreden: reden },
        include: { wcagCriterion: true, occurrences: true },
      });
      // Ook na een afwijzing herberekenen: het voorstel telde niet mee, maar de
      // regel hoort op één plek te blijven en is hier goedkoop.
      const oordeel = await herberekenCriteriumOordeel(params.id, finding.wcagCriterionId);
      return NextResponse.json({ finding: bijgewerkt, criteriumOordeel: oordeel });
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

    const oordeel = await herberekenCriteriumOordeel(params.id, finding.wcagCriterionId);

    return NextResponse.json({
      finding: bijgewerkt,
      technicalIssue: issue,
      hergebruikt: !body.forceerNieuw && issue.createdAt < bijgewerkt.updatedAt,
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
