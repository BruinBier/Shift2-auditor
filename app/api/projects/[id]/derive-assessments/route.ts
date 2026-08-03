import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Leidt de project-brede CriterionAssessment af uit de beoordelingen per steekproefitem.
 *
 * De regel (vastgesteld met Frits op 2026-08-02, aangescherpt op 2026-08-03):
 *   - ergens een afkeuring          -> failed
 *   - alleen voldoet/niet_aanwezig  -> passed
 *   - alleen opmerkingen, geen afkeuring -> passed (een opmerking is geen WCAG-schending)
 *   - overal niet_aanwezig          -> not_present
 *
 * Samples met `niet_te_bepalen` tellen NIET mee. Zo'n sample levert geen tegenbewijs: er is
 * daar niets gevonden dat het criterium schendt, alleen iets dat niet te toetsen viel. Is
 * 1.3.2 op achttien HTML-pagina's in orde en bij twee ongetagde PDF's niet te bepalen, dan is
 * de project-status gewoon `passed`; de ontbrekende tags worden al onder 1.3.1 afgekeurd.
 *
 * Alleen als ALLE samples op `niet_te_bepalen` staan, is er echt geen oordeel en blokkeert
 * het criterium het afronden.
 *
 * GET  = alleen berekenen en tonen (droogloop)
 * POST = berekenen en wegschrijven naar CriterionAssessment
 */
async function bereken(projectId: string) {
  const checks = await prisma.sampleCriterionCheck.findMany({
    where: { sampleItem: { projectId } },
    include: {
      wcagCriterion: { select: { id: true, code: true, titleNl: true } },
      sampleItem: { select: { title: true } },
    },
  });

  if (!checks.length) {
    return { leeg: true, criteria: [], blokkades: [] };
  }

  // Groeperen per criterium.
  const perCriterium = new Map<string, typeof checks>();
  for (const c of checks) {
    const lijst = perCriterium.get(c.wcagCriterionId) ?? [];
    lijst.push(c);
    perCriterium.set(c.wcagCriterionId, lijst);
  }

  const criteria: any[] = [];
  const blokkades: any[] = [];

  for (const [criterionId, lijst] of perCriterium) {
    const code = lijst[0].wcagCriterion.code;
    const tel = (s: string) => lijst.filter((c) => c.status === s).length;

    const open = lijst.filter((c) => c.status === 'niet_te_bepalen');

    // Alleen als er NERGENS een oordeel is, valt er niets af te leiden. Losse
    // niet_te_bepalen-samples tellen niet mee: die leveren geen tegenbewijs.
    const beoordeeld = lijst.filter((c) => c.status !== 'niet_te_bepalen');
    if (!beoordeeld.length) {
      blokkades.push({
        code,
        aantal: open.length,
        samples: open.map((c) => c.sampleItem.title),
        vragen: open.map((c) => ({ sample: c.sampleItem.title, reden: c.reden })),
      });
      continue;
    }

    let status: 'failed' | 'passed' | 'not_present';
    if (beoordeeld.some((c) => c.status === 'afgekeurd')) {
      status = 'failed';
    } else if (beoordeeld.every((c) => c.status === 'niet_aanwezig')) {
      status = 'not_present';
    } else {
      // voldoet, eventueel met opmerkingen ertussen
      status = 'passed';
    }

    criteria.push({
      criterionId,
      code,
      titel: lijst[0].wcagCriterion.titleNl,
      status,
      telling: {
        voldoet: tel('voldoet'),
        afgekeurd: tel('afgekeurd'),
        opmerking: tel('opmerking'),
        niet_aanwezig: tel('niet_aanwezig'),
        niet_te_bepalen: open.length,
      },
      afgekeurdOp: lijst.filter((c) => c.status === 'afgekeurd').map((c) => c.sampleItem.title),
      // Samples die buiten het oordeel zijn gelaten, zodat zichtbaar blijft waar niet is getoetst.
      nietBeoordeeldOp: open.map((c) => c.sampleItem.title),
    });
  }

  criteria.sort((a, b) => {
    const pa = a.code.split('.').map(Number);
    const pb = b.code.split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  });
  blokkades.sort((a, b) => a.code.localeCompare(b.code));

  return { leeg: false, criteria, blokkades };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await bereken(params.id);
    return NextResponse.json({
      ...res,
      samenvatting: {
        berekend: res.criteria.length,
        failed: res.criteria.filter((c: any) => c.status === 'failed').length,
        passed: res.criteria.filter((c: any) => c.status === 'passed').length,
        not_present: res.criteria.filter((c: any) => c.status === 'not_present').length,
        geblokkeerd: res.blokkades.length,
      },
      kanAfronden: res.blokkades.length === 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Kon niet afleiden: ${error?.message ?? error}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await bereken(params.id);
    if (res.leeg) {
      return NextResponse.json(
        { error: 'Geen beoordelingen per steekproefitem gevonden. Draai eerst de audit.' },
        { status: 400 },
      );
    }

    for (const c of res.criteria) {
      const bestaand = await prisma.criterionAssessment.findFirst({
        where: { projectId: params.id, wcagCriterionId: c.criterionId },
      });
      if (bestaand) {
        await prisma.criterionAssessment.update({
          where: { id: bestaand.id },
          data: { status: c.status },
        });
      } else {
        await prisma.criterionAssessment.create({
          data: { projectId: params.id, wcagCriterionId: c.criterionId, status: c.status },
        });
      }
    }

    return NextResponse.json({
      weggeschreven: res.criteria.length,
      geblokkeerd: res.blokkades.length,
      blokkades: res.blokkades,
      kanAfronden: res.blokkades.length === 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Kon niet wegschrijven: ${error?.message ?? error}` }, { status: 500 });
  }
}
