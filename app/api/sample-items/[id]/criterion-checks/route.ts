import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STATUSSEN = ['voldoet', 'afgekeurd', 'opmerking', 'niet_aanwezig', 'niet_te_bepalen'] as const;
const BRONNEN = ['workflow', 'gesprek', 'handmatig'] as const;
const AKKOORD = ['voorgesteld', 'akkoord', 'afgewezen'] as const;

type Status = (typeof STATUSSEN)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const checks = await prisma.sampleCriterionCheck.findMany({
      where: { sampleItemId: params.id },
      include: { wcagCriterion: { select: { code: true, titleNl: true, level: true } } },
    });

    // Sorteren op SC-code (1.4.10 hoort ná 1.4.3, dus numeriek per deel).
    checks.sort((a, b) => {
      const pa = a.wcagCriterion.code.split('.').map(Number);
      const pb = b.wcagCriterion.code.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
      }
      return 0;
    });

    const telling = STATUSSEN.reduce(
      (acc, s) => ({ ...acc, [s]: checks.filter((c) => c.status === s).length }),
      {} as Record<Status, number>,
    );

    return NextResponse.json({
      sampleItemId: params.id,
      totaal: checks.length,
      telling,
      // Openstaande vragen blokkeren het afronden van het project.
      openstaandeVragen: checks
        .filter((c) => c.status === 'niet_te_bepalen')
        .map((c) => ({ code: c.wcagCriterion.code, reden: c.reden })),
      wachtOpAkkoord: checks.filter((c) => c.akkoord === 'voorgesteld').length,
      checks,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Kon de beoordelingen niet ophalen' }, { status: 500 });
  }
}

/**
 * Schrijft de beoordelingen van één steekproefitem weg.
 *
 * Body: { checks: [{ criterionCode | wcagCriterionId, status, reden?, bron?, akkoord? }] }
 *
 * Upsert per sample x criterium: een nieuwe audit overschrijft de vorige beoordeling. Dat is
 * bewust — de tabel legt de actuele stand vast, geen geschiedenis.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const checks = Array.isArray(body?.checks) ? body.checks : null;
    if (!checks) {
      return NextResponse.json({ error: 'Body moet een array "checks" bevatten' }, { status: 400 });
    }

    const sample = await prisma.sampleItem.findUnique({ where: { id: params.id } });
    if (!sample) {
      return NextResponse.json({ error: 'Steekproefitem bestaat niet' }, { status: 404 });
    }

    // Criteria opzoeken op code, zodat de aanroeper geen id's hoeft te kennen.
    const criteria = await prisma.wCAGCriterion.findMany({
      select: { id: true, code: true },
    });
    const opCode = new Map(criteria.map((c) => [c.code, c.id]));
    const bestaandeIds = new Set(criteria.map((c) => c.id));

    const fouten: string[] = [];
    const rijen: {
      wcagCriterionId: string;
      status: Status;
      reden: string | null;
      bron: (typeof BRONNEN)[number];
      akkoord: (typeof AKKOORD)[number] | null;
    }[] = [];

    for (const [i, c] of checks.entries()) {
      const critId = c.wcagCriterionId || (c.criterionCode ? opCode.get(c.criterionCode) : null);
      if (!critId || !bestaandeIds.has(critId)) {
        fouten.push(`checks[${i}]: onbekend criterium (${c.criterionCode ?? c.wcagCriterionId})`);
        continue;
      }
      if (!STATUSSEN.includes(c.status)) {
        fouten.push(`checks[${i}]: ongeldige status "${c.status}"`);
        continue;
      }
      if (c.bron && !BRONNEN.includes(c.bron)) {
        fouten.push(`checks[${i}]: ongeldige bron "${c.bron}"`);
        continue;
      }
      if (c.akkoord && !AKKOORD.includes(c.akkoord)) {
        fouten.push(`checks[${i}]: ongeldige akkoord-waarde "${c.akkoord}"`);
        continue;
      }
      rijen.push({
        wcagCriterionId: critId,
        status: c.status,
        reden: c.reden ?? null,
        bron: c.bron ?? 'workflow',
        akkoord: c.akkoord ?? null,
      });
    }

    if (fouten.length) {
      return NextResponse.json({ error: 'Ongeldige invoer', details: fouten }, { status: 400 });
    }

    // Alles in één transactie: een halfgevulde registratie geeft valse zekerheid over dekking.
    await prisma.$transaction(
      rijen.map((r) =>
        prisma.sampleCriterionCheck.upsert({
          where: {
            sampleItemId_wcagCriterionId: {
              sampleItemId: params.id,
              wcagCriterionId: r.wcagCriterionId,
            },
          },
          create: { sampleItemId: params.id, ...r },
          update: { status: r.status, reden: r.reden, bron: r.bron, akkoord: r.akkoord, checkedAt: new Date() },
        }),
      ),
    );

    const totaal = await prisma.sampleCriterionCheck.count({ where: { sampleItemId: params.id } });
    return NextResponse.json({ weggeschreven: rijen.length, totaalVoorSample: totaal });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Kon de beoordelingen niet wegschrijven: ${error?.message ?? error}` },
      { status: 500 },
    );
  }
}
