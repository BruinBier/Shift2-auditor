import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bekendeGebieden, huidigeLijst, leesGebieden, voegSamen } from '@/lib/deelgebieden';
import { zetTerugNaarVoorstel } from '@/lib/finding-code';

/**
 * De sampleoordelen van een project: het oordeel per criterium per pagina.
 *
 * Hier landt wat de audit-samples-workflow uitrekent. Die berekende het al —
 * twintig samples maal drieendertig criteria — maar gooide alles weg behalve de
 * fouten. Daardoor was niet te onderscheiden of een criterium in orde was of
 * nooit bekeken. Zie docs/adr/0001-akkoord-als-poort.md.
 */

const GELDIGE_STATUS = new Set([
  'voldoet',
  'afgekeurd',
  'opmerking',
  'niet_aanwezig',
  'niet_te_bepalen',
]);

const GELDIGE_BRON = new Set(['workflow', 'gesprek', 'handmatig']);

const GELDIG_AKKOORD = new Set(['voorgesteld', 'akkoord', 'afgewezen']);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const checks = await prisma.sampleCriterionCheck.findMany({
      where: { sampleItem: { projectId: params.id } },
      include: {
        wcagCriterion: { select: { code: true, titleNl: true } },
        sampleItem: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(
      checks.map((c) => ({
        sampleItemId: c.sampleItemId,
        sample: c.sampleItem.title,
        criterionCode: c.wcagCriterion.code,
        status: c.status,
        reden: c.reden,
        bron: c.bron,
        akkoord: c.akkoord,
        verantwoording: c.verantwoording,
        controle: c.controle,
        checkedAt: c.checkedAt,
      }))
    );
  } catch (error: any) {
    console.error('Fout bij ophalen sampleoordelen:', error);
    return NextResponse.json({ error: 'Ophalen mislukt' }, { status: 500 });
  }
}

/**
 * Schrijft oordelen weg. Bestaat er al een oordeel voor die combinatie van sample
 * en criterium, dan wordt het bijgewerkt — een volgende auditronde overschrijft
 * de vorige in plaats van een tweede rij aan te maken.
 *
 * Body: { bron?, akkoord?, checks: [{ sampleItemId, criterionCode, status, reden?, akkoord?, bron? }] }
 *
 * `bron` mag ook per oordeel mee. Dat is nodig voor koppel-logboek: dat commando hangt
 * alleen het meetspoor aan bestaande oordelen en hoort niet te bepalen waar die vandaan
 * kwamen. Zonder dit stempelde elke koppelactie alles als 'workflow', ook een oordeel dat
 * uit een gesprek kwam — en dan staat er op de kaart dat de workflow iets niet gedaan
 * heeft wat de workflow nooit had moeten doen.
 *
 * `akkoord` is de poort op sampleniveau: een oordeel dat een agent heeft geveld,
 * telt pas als de onderzoeker het heeft bevestigd. De workflow laat het leeg; het
 * scherm zet het op 'akkoord' zodra jij het hebt nagelopen.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const checks: any[] = Array.isArray(body.checks) ? body.checks : [];
    const bron: string = body.bron ?? 'workflow';

    if (!checks.length) {
      return NextResponse.json({ error: 'checks is leeg' }, { status: 400 });
    }
    if (!GELDIGE_BRON.has(bron)) {
      return NextResponse.json(
        { error: `bron moet een van ${Array.from(GELDIGE_BRON).join(', ')} zijn` },
        { status: 400 }
      );
    }

    // Sample-items van dit project, zodat een oordeel niet per ongeluk op een
    // pagina van een ander onderzoek belandt.
    const eigenSamples = await prisma.sampleItem.findMany({
      where: { projectId: params.id },
      select: { id: true },
    });
    const eigen = new Set(eigenSamples.map((s) => s.id));

    const codes = Array.from(new Set(checks.map((c) => c.criterionCode).filter(Boolean)));
    const criteria = await prisma.wCAGCriterion.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });
    const idVanCode = new Map(criteria.map((c) => [c.code, c.id]));

    const fouten: string[] = [];
    let geschreven = 0;
    // Akkoorden die vervielen doordat het oordeel inhoudelijk veranderde. Melden
    // in het antwoord, zodat een workflow-run niet stilzwijgend werk terugdraait.
    let vervallen = 0;
    /** De codes van bevindingen die met een vervallen akkoord weer voorstel zijn geworden. */
    const teruggezet: string[] = [];

    for (const check of checks) {
      const { sampleItemId, criterionCode, status } = check;

      if (!eigen.has(sampleItemId)) {
        fouten.push(`sample ${sampleItemId} hoort niet bij dit project`);
        continue;
      }
      const wcagCriterionId = idVanCode.get(criterionCode);
      if (!wcagCriterionId) {
        fouten.push(`onbekend criterium ${criterionCode}`);
        continue;
      }
      if (!GELDIGE_STATUS.has(status)) {
        fouten.push(`ongeldige status "${status}" bij ${criterionCode}`);
        continue;
      }

      const akkoord = check.akkoord ?? body.akkoord ?? null;
      if (akkoord && !GELDIG_AKKOORD.has(akkoord)) {
        fouten.push(`ongeldig akkoord "${akkoord}" bij ${criterionCode}`);
        continue;
      }

      // Waarop het oordeel rust en of dat standhoudt. Beide staan bewust los van
      // `reden`: die tekst bepaalt of een akkoord vervalt, en een nieuwe meetronde
      // hoort geen goedkeuringen in te trekken. Wordt er niets meegestuurd, dan
      // blijft staan wat er stond — een schrijfactie die deze velden niet kent, mag
      // ze niet wissen.
      const verantwoording = check.verantwoording ?? undefined;
      const controle = check.controle ?? undefined;

      /**
       * Een criterium met deelgebieden komt er niet in zonder die gebieden.
       *
       * Eén agent onderzoekt één succescriterium op één pagina. De vraag die de onderzoeker
       * bij het nakijken heeft is niet alleen "klopt dit oordeel" maar "heeft de agent zijn
       * opdracht afgemaakt" — en een agent die drie van de zes gebieden overslaat en over de
       * andere drie netjes schrijft, levert iets op dat er precies zo uitziet als volledig
       * werk. Dat is niet aan de tekst te zien; dat was de hele les van BEV-03.
       *
       * De controle staat hier en niet op de kaart, want daar is het te laat: dan moet de
       * onderzoeker het bij elke kaart zelf opmerken en de agent terugsturen. Dertig criteria
       * maal twintig pagina's aan waakzaamheid. Hier kan de fout niet ontstaan.
       *
       * De gebieden gaan in dezelfde aanroep mee, en niet via `save-gebieden` erna: die route
       * eist een bestaand oordeel, dus zou een weigering hier betekenen dat de agent nooit
       * kan beginnen. Oordeel en verantwoording zijn één handeling, of geen.
       *
       * Kan een gebied niet beoordeeld worden, dan is er `nvt` — dan staat er dát het niet
       * kon, en dat is precies de informatie die een lopende onderbouwing weglaat.
       *
       * Alleen voor criteria die `### Deelgebieden` in hun regelbestand hebben; voor de rest
       * verandert er niets tot iemand die lijst schrijft.
       */
      // Eén keer ophalen: de gebiedencontrole hieronder en het akkoord verderop kijken
      // allebei naar de rij die er al staat.
      const bestaande = await prisma.sampleCriterionCheck.findUnique({
        where: { sampleItemId_wcagCriterionId: { sampleItemId, wcagCriterionId } },
        select: { status: true, reden: true, akkoord: true, gebieden: true },
      });

      const bekend = bekendeGebieden(criterionCode);
      let gebiedenVoorDitOordeel: any[] | undefined;
      if (bekend.length) {
        const gelezen = leesGebieden(
          criterionCode,
          Array.isArray(check.gebieden) ? check.gebieden : [],
          bekend
        );
        if ('fout' in gelezen) {
          fouten.push(`${criterionCode}: ${gelezen.fout}`);
          continue;
        }

        const { gebieden: samen, open } = voegSamen(
          huidigeLijst(bestaande?.gebieden),
          gelezen.gebieden,
          bekend
        );

        if (open.length) {
          fouten.push(
            `${criterionCode} op sample ${sampleItemId}: ${open.length} van de ${bekend.length} deelgebieden zijn niet nagelopen (${open.join(', ')}). ` +
              `Stuur ze mee als "gebieden": [{ "gebied": "...", "uitkomst": "ok|nvt|fout|opmerking", "toelichting": "..." }].`
          );
          continue;
        }
        gebiedenVoorDitOordeel = samen;
      }

      // Per oordeel mag de bron mee; anders geldt die van de body.
      const bronVanDitOordeel: string = check.bron ?? bron;
      if (!GELDIGE_BRON.has(bronVanDitOordeel)) {
        fouten.push(`ongeldige bron "${bronVanDitOordeel}" bij ${criterionCode}`);
        continue;
      }

      // Een akkoord hoort bij een oordeel, niet bij een combinatie van sample en
      // criterium. Schrijft een nieuwe auditronde een ander oordeel of een andere
      // onderbouwing weg, dan slaat het oude akkoord nergens meer op en vervalt
      // het — de onderzoeker moet dan opnieuw kijken.
      //
      // Dit stond eerst andersom, waardoor akkoorden van 3 augustus bleven staan
      // op teksten die vanmiddag zijn overschreven. De bewering "dit is bevestigd"
      // sloeg dan op iets wat er niet meer stond.
      const nieuweReden = check.reden ?? null;
      const inhoudelijkGewijzigd =
        !!bestaande && (bestaande.status !== status || (bestaande.reden ?? null) !== nieuweReden);

      const nieuwAkkoord = akkoord
        ? akkoord
        : inhoudelijkGewijzigd
          ? null
          : (bestaande?.akkoord ?? null);

      await prisma.sampleCriterionCheck.upsert({
        where: {
          sampleItemId_wcagCriterionId: { sampleItemId, wcagCriterionId },
        },
        create: {
          sampleItemId,
          wcagCriterionId,
          status,
          reden: nieuweReden,
          bron: bronVanDitOordeel as any,
          akkoord: akkoord as any,
          ...(verantwoording !== undefined ? { verantwoording } : {}),
          ...(controle !== undefined ? { controle } : {}),
          ...(gebiedenVoorDitOordeel ? { gebieden: gebiedenVoorDitOordeel as any } : {}),
        },
        update: {
          status,
          reden: nieuweReden,
          bron: bronVanDitOordeel as any,
          akkoord: nieuwAkkoord as any,
          checkedAt: new Date(),
          ...(verantwoording !== undefined ? { verantwoording } : {}),
          ...(controle !== undefined ? { controle } : {}),
          ...(gebiedenVoorDitOordeel ? { gebieden: gebiedenVoorDitOordeel as any } : {}),
        },
      });
      geschreven++;

      /**
       * Vervalt het akkoord, dan gaan de bevindingen mee terug naar voorstel.
       *
       * Een nieuwe beoordeling is een nieuw oordeel: de tekst die je goedkeurde staat er niet
       * meer, dus je akkoord slaat nergens meer op. De bevindingen die eronder hingen zijn
       * daarmee ook weer voorstellen — hun code gaat van `B00x` terug naar `V00x` en hun
       * status naar `voorstel`.
       *
       * Zonder dit staat er een code die "goedgekeurd" betekent op een kaart die om
       * goedkeuring vraagt, en telt de bevinding intussen gewoon mee in het rapport. Dat is
       * precies wat de poort moet voorkomen (docs/adr/0001-akkoord-als-poort.md).
       */
      if (inhoudelijkGewijzigd && bestaande?.akkoord === 'akkoord' && !akkoord) {
        vervallen++;
        const hangende = await prisma.finding.findMany({
          where: {
            projectId: params.id,
            wcagCriterionId,
            status: { in: ['open', 'published'] },
            occurrences: { some: { sampleItemId } },
          },
          select: { id: true },
        });
        for (const f of hangende) {
          try {
            const nieuw = await zetTerugNaarVoorstel(params.id, f.id);
            if (nieuw?.startsWith('V')) teruggezet.push(nieuw);
          } catch (e: any) {
            // Het oordeel is al weggeschreven; een bevinding die niet terugkan mag dat niet
            // ongedaan maken. Melden en doorgaan.
            fouten.push(
              `${criterionCode}: bevinding ${f.id} kon niet terug naar voorstel (${e?.message ?? 'onbekende fout'})`
            );
          }
        }
      }
    }

    return NextResponse.json({
      geschreven,
      overgeslagen: fouten.length,
      akkoordVervallen: vervallen,
      // Welke bevindingen weer voorstel zijn geworden. In het antwoord en niet alleen in de
      // database, zodat een agent het meldt en de onderzoeker weet wat er opnieuw op zijn
      // stapel ligt.
      ...(teruggezet.length ? { terugNaarVoorstel: teruggezet } : {}),
      fouten: fouten.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Fout bij wegschrijven sampleoordelen:', error);
    return NextResponse.json(
      { error: 'Wegschrijven mislukt', details: error?.message },
      { status: 500 }
    );
  }
}
