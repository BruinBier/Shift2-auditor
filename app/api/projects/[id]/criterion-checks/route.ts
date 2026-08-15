import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
 * Body: { bron?, akkoord?, checks: [{ sampleItemId, criterionCode, status, reden?, akkoord? }] }
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

      // Een akkoord hoort bij een oordeel, niet bij een combinatie van sample en
      // criterium. Schrijft een nieuwe auditronde een ander oordeel of een andere
      // onderbouwing weg, dan slaat het oude akkoord nergens meer op en vervalt
      // het — de onderzoeker moet dan opnieuw kijken.
      //
      // Dit stond eerst andersom, waardoor akkoorden van 3 augustus bleven staan
      // op teksten die vanmiddag zijn overschreven. De bewering "dit is bevestigd"
      // sloeg dan op iets wat er niet meer stond.
      const nieuweReden = check.reden ?? null;
      const bestaande = await prisma.sampleCriterionCheck.findUnique({
        where: { sampleItemId_wcagCriterionId: { sampleItemId, wcagCriterionId } },
        select: { status: true, reden: true, akkoord: true },
      });

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
          bron: bron as any,
          akkoord: akkoord as any,
        },
        update: {
          status,
          reden: nieuweReden,
          bron: bron as any,
          akkoord: nieuwAkkoord as any,
          checkedAt: new Date(),
        },
      });
      geschreven++;
      if (inhoudelijkGewijzigd && bestaande?.akkoord === 'akkoord' && !akkoord) vervallen++;
    }

    return NextResponse.json({
      geschreven,
      overgeslagen: fouten.length,
      akkoordVervallen: vervallen,
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
