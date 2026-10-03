import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { oordeelUitChecks, steekproefVan, zetVoorbarigOordeelTerug } from '@/lib/criterion-assessment';

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
 * Een pagina in de steekproef ZONDER oordeel voor een criterium is wel een blokkade
 * (sinds 2026-10-03): daar heeft nog niemand gekeken. Alleen een afkeuring elders gaat
 * voor; die blijft `failed`.
 *
 * GET  = alleen berekenen en tonen (droogloop)
 * POST = berekenen en wegschrijven naar CriterionAssessment
 */
/**
 * Eén beoordeling met de velden die hier gebruikt worden.
 *
 * Zonder dit type kwam elke `c` in de filters hieronder als impliciet `any` binnen: tien
 * meldingen van de typecontrole op één plek. Erger dan de melding is wat je kwijt was --
 * `c.status` werd niet meer vergeleken met de echte statuswaarden, dus een typefout in
 * 'afgekeurd' zou hier stilletjes nooit meer aanslaan en een criterium ten onrechte op
 * `passed` zetten. Dat is precies de berekening waar de oordelen van afhangen.
 */
type Beoordeling = Awaited<ReturnType<typeof haalChecks>>[number];

function haalChecks(projectId: string) {
  return prisma.sampleCriterionCheck.findMany({
    where: { sampleItem: { projectId } },
    include: {
      wcagCriterion: { select: { id: true, code: true, titleNl: true } },
      sampleItem: { select: { title: true } },
    },
  });
}

async function bereken(projectId: string) {
  const checks = await haalChecks(projectId);
  const steekproef = await steekproefVan(projectId);

  if (!checks.length) {
    return { leeg: true, criteria: [], blokkades: [] };
  }

  // Groeperen per criterium.
  const perCriterium = new Map<string, Beoordeling[]>();
  for (const c of checks) {
    const lijst = perCriterium.get(c.wcagCriterionId) ?? [];
    lijst.push(c);
    perCriterium.set(c.wcagCriterionId, lijst);
  }

  const criteria: any[] = [];
  const blokkades: any[] = [];

  // Via Array.from, want het compileerdoel van dit project laat het aflopen van een Map
  // niet rechtstreeks toe (TS2802). Dezelfde volgorde, dezelfde inhoud.
  for (const [criterionId, lijst] of Array.from(perCriterium.entries())) {
    const code = lijst[0].wcagCriterion.code;
    const tel = (s: string) => lijst.filter((c) => c.status === s).length;

    const open = lijst.filter((c) => c.status === 'niet_te_bepalen');
    const metOordeel = new Set(lijst.map((c) => c.sampleItemId));
    const zonderOordeel = steekproef.filter((s) => !metOordeel.has(s.id));

    // Dezelfde rekenregel als bij het opslaan van de sampleoordelen. Eén versie, in
    // lib/criterion-assessment.ts: liepen ze uit elkaar, dan gaf de knop hier een ander
    // antwoord dan de audit zelf net had weggeschreven.
    const status = oordeelUitChecks(lijst.map((c) => c.status), zonderOordeel.length);

    // Geen oordeel: alles stond op niet_te_bepalen, of er is een pagina waar nog niemand
    // heeft gekeken. Losse niet_te_bepalen-samples naast een oordeel blokkeren niet.
    if (!status) {
      blokkades.push({
        criterionId,
        code,
        aantal: open.length + zonderOordeel.length,
        samples: [...open.map((c) => c.sampleItem.title), ...zonderOordeel.map((s) => s.title)],
        vragen: open.map((c) => ({ sample: c.sampleItem.title, reden: c.reden })),
        zonderOordeel: zonderOordeel.map((s) => s.title),
      });
      continue;
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
      // Kan alleen naast een afkeuring voorkomen; anders was het een blokkade.
      zonderOordeel: zonderOordeel.map((s) => s.title),
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

    // Een te vroeg afgeleid oordeel weghalen bij een criterium waar nog pagina's open zijn.
    for (const b of res.blokkades) {
      if (b.zonderOordeel?.length) await zetVoorbarigOordeelTerug(params.id, b.criterionId);
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
