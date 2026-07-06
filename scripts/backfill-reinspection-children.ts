import { prisma } from '../lib/prisma';

/**
 * One-off backfill: create the missing v1.1 herinspectie child project for every
 * parent that has hasReinspection=true but no child. Mirrors ensureReinspectionChild()
 * in app/api/projects/[id]/route.ts. Safe to re-run (skips parents that already have a child).
 *
 * Usage:
 *   npx tsx scripts/backfill-reinspection-children.ts          # dry run (list only)
 *   npx tsx scripts/backfill-reinspection-children.ts --apply  # actually create
 */
(async () => {
  const apply = process.argv.includes('--apply');

  const flagged = await prisma.project.findMany({
    where: { hasReinspection: true },
  });

  const childParentIds = new Set(
    (
      await prisma.project.findMany({
        where: { parentProjectId: { not: null } },
        select: { parentProjectId: true },
      })
    ).map((c) => c.parentProjectId!)
  );

  const missing = flagged.filter((p) => !childParentIds.has(p.id));

  console.log(`Parents met hasReinspection=true: ${flagged.length}`);
  console.log(`Zonder kindproject: ${missing.length}\n`);

  for (const parent of missing) {
    let reinspectionStart: Date | null = null;
    let reinspectionEnd: Date | null = null;
    if (parent.reinspectionDate) {
      reinspectionStart = new Date(parent.reinspectionDate);
      reinspectionEnd = new Date(reinspectionStart);
      reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);
    } else if (parent.reinspectionWeeks && parent.dateEnd) {
      reinspectionStart = new Date(parent.dateEnd);
      reinspectionStart.setDate(reinspectionStart.getDate() + parent.reinspectionWeeks * 7);
      reinspectionEnd = new Date(reinspectionStart);
      reinspectionEnd.setDate(reinspectionEnd.getDate() + 7);
    }

    console.log(
      `${apply ? 'AANMAKEN' : '[dry-run]'}  v1.1 voor "${parent.title}" (${parent.id})  ` +
        `start=${reinspectionStart?.toISOString().slice(0, 10) ?? 'leeg'} ` +
        `eind=${reinspectionEnd?.toISOString().slice(0, 10) ?? 'leeg'}`
    );

    if (!apply) continue;

    const child = await prisma.project.create({
      data: {
        kenmerk: parent.kenmerk,
        title: parent.title,
        subject: parent.subject ?? '',
        standard: parent.standard,
        level: parent.level,
        researchType: parent.researchType,
        version: 1.1,
        language: parent.language,
        status: parent.status === 'In de wacht' ? 'In de wacht' : 'Gepland',
        clientName: parent.clientName,
        commissionedBy: parent.commissionedBy,
        clientProjectId: parent.clientProjectId,
        auditedByOrg: parent.auditedByOrg,
        researcherName: parent.researcherName,
        controllerName: parent.controllerName,
        plannedTime: parent.plannedTime,
        dateStart: reinspectionStart,
        dateEnd: reinspectionEnd,
        researchStartedOn: null,
        reportDate: reinspectionEnd ?? new Date(),
        description: parent.description,
        isAnonymous: parent.isAnonymous,
        isPrivate: parent.isPrivate,
        hasReinspection: false,
        reinspectionWeeks: null,
        parentProjectId: parent.id,
        checkPhase: 'tussencheck',
      },
    });
    console.log(`   -> aangemaakt: ${child.id}`);
  }

  if (!apply && missing.length) {
    console.log('\nDry run. Voer opnieuw uit met --apply om de kinderen aan te maken.');
  }

  await prisma.$disconnect();
})();
