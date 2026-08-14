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
 * Body: { bron?, checks: [{ sampleItemId, criterionCode, status, reden? }] }
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

      await prisma.sampleCriterionCheck.upsert({
        where: {
          sampleItemId_wcagCriterionId: { sampleItemId, wcagCriterionId },
        },
        create: {
          sampleItemId,
          wcagCriterionId,
          status,
          reden: check.reden ?? null,
          bron: bron as any,
        },
        update: {
          status,
          reden: check.reden ?? null,
          bron: bron as any,
          checkedAt: new Date(),
        },
      });
      geschreven++;
    }

    return NextResponse.json({
      geschreven,
      overgeslagen: fouten.length,
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
