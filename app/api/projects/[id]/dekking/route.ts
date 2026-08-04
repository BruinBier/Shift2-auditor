import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Dekkingscontrole: is elk criterium op elk steekproefitem daadwerkelijk nagelopen?
 *
 * Waarom naast derive-assessments: dat endpoint leidt de project-status af uit wat er WEL
 * beoordeeld is. Het zegt niets over wat ontbreekt. Staat 2.4.6 op vijftien van de twintig
 * samples geregistreerd, dan komt er gewoon een status uit en valt niet op dat vijf pagina's
 * zijn overgeslagen. Een gat in de dekking is per definitie onzichtbaar in de uitkomst.
 *
 * Drie soorten gaten, oplopend in ernst:
 *   1. ontbrekend      — geen rij: er is niet naar gekeken, en niemand weet dat
 *   2. zonderOnderbouwing — status 'voldoet' met een leeg reden-veld: aangenomen, niet onderzocht
 *   3. openVragen      — 'niet_te_bepalen': bewust opengelaten, wacht op de onderzoeker
 *
 * Nummer 2 is het venijnigst. Een afkeuring komt in het rapport terecht en wordt gelezen; een
 * goedkeuring levert geen tekst op waar een fout aan het licht komt. Zonder onderbouwing is
 * niet te zien of 'voldoet' uit onderzoek komt of uit gemakzucht.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, kenmerk: true, researchType: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const samples = await prisma.sampleItem.findMany({
      where: { projectId: params.id },
      select: { id: true, title: true, sampleType: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Project.researchType is een naam-string, geen relatie; de criteria hangen aan de
    // ResearchType met die naam. Zonder onderzoekstype valt niet te zeggen wat er getoetst
    // had moeten worden, en dus ook niet wat er ontbreekt.
    const researchType = project.researchType
      ? await prisma.researchType.findUnique({
          where: { name: project.researchType },
          select: { name: true, criteria: { select: { wcagCriterionId: true } } },
        })
      : null;

    const criterionIds = researchType?.criteria.map((c) => c.wcagCriterionId) ?? [];
    if (!criterionIds.length) {
      return NextResponse.json(
        { error: 'Het project heeft geen onderzoekstype met criteria; dekking is niet te bepalen.' },
        { status: 400 },
      );
    }

    const criteria = await prisma.wCAGCriterion.findMany({
      where: { id: { in: criterionIds } },
      select: { id: true, code: true, titleNl: true, level: true },
    });

    const checks = await prisma.sampleCriterionCheck.findMany({
      where: { sampleItem: { projectId: params.id } },
      select: {
        sampleItemId: true,
        wcagCriterionId: true,
        status: true,
        reden: true,
        bron: true,
      },
    });

    const sleutel = (s: string, c: string) => `${s}::${c}`;
    const index = new Map(checks.map((c) => [sleutel(c.sampleItemId, c.wcagCriterionId), c]));

    const ontbrekend: any[] = [];
    const zonderOnderbouwing: any[] = [];
    const openVragen: any[] = [];
    const perSample: any[] = [];

    for (const sample of samples) {
      let beoordeeld = 0;
      const gatenHier: string[] = [];

      for (const crit of criteria) {
        const check = index.get(sleutel(sample.id, crit.id));

        if (!check) {
          ontbrekend.push({ sample: sample.title, sampleId: sample.id, code: crit.code, titel: crit.titleNl });
          gatenHier.push(crit.code);
          continue;
        }

        beoordeeld++;

        // Een 'voldoet' zonder toelichting is niet te controleren. Zie het commentaar boven.
        if (check.status === 'voldoet' && !check.reden?.trim()) {
          zonderOnderbouwing.push({ sample: sample.title, sampleId: sample.id, code: crit.code });
        }

        if (check.status === 'niet_te_bepalen') {
          openVragen.push({
            sample: sample.title,
            sampleId: sample.id,
            code: crit.code,
            vraag: check.reden ?? null,
          });
        }
      }

      perSample.push({
        sampleId: sample.id,
        titel: sample.title,
        type: sample.sampleType,
        beoordeeld,
        verwacht: criteria.length,
        volledig: beoordeeld === criteria.length,
        ontbrekendeCodes: gatenHier,
      });
    }

    const sorteerCode = (a: any, b: any) => {
      const pa = a.code.split('.').map(Number);
      const pb = b.code.split('.').map(Number);
      for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
      return 0;
    };
    ontbrekend.sort(sorteerCode);
    zonderOnderbouwing.sort(sorteerCode);
    openVragen.sort(sorteerCode);

    const verwacht = samples.length * criteria.length;

    return NextResponse.json({
      project: project.kenmerk ?? project.title,
      onderzoekstype: researchType?.name ?? null,
      samenvatting: {
        samples: samples.length,
        criteria: criteria.length,
        verwacht,
        geregistreerd: checks.length,
        ontbrekend: ontbrekend.length,
        zonderOnderbouwing: zonderOnderbouwing.length,
        openVragen: openVragen.length,
      },
      // Alleen compleet als er geen gaten zijn EN elke goedkeuring onderbouwd is.
      // Open vragen blokkeren niet: die zijn bewust opengelaten en wachten op de onderzoeker.
      dekkingCompleet: ontbrekend.length === 0 && zonderOnderbouwing.length === 0,
      perSample,
      ontbrekend,
      zonderOnderbouwing,
      openVragen,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Kon de dekking niet bepalen: ${error?.message ?? error}` },
      { status: 500 },
    );
  }
}
