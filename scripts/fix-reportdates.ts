import { prisma } from '../lib/prisma';

const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

/**
 * Fix reportDate for non-finished projects where it was wrongly set to the
 * creation date instead of the deadline (dateEnd). Skips Gereed/Geannuleerd
 * projects, whose reportDate is the real delivery date and may legitimately
 * differ from the deadline.
 *
 *   npx tsx scripts/fix-reportdates.ts          # dry run
 *   npx tsx scripts/fix-reportdates.ts --apply  # write
 */
(async () => {
  const apply = process.argv.includes('--apply');
  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '—');

  const candidates = await prisma.project.findMany({
    where: {
      status: { notIn: ['Gereed', 'Geannuleerd'] },
      dateEnd: { not: null },
    },
    select: {
      id: true, kenmerk: true, title: true, version: true, status: true,
      dateEnd: true, reportDate: true,
    },
    orderBy: [{ title: 'asc' }, { version: 'asc' }],
  });

  const toFix = candidates.filter((p) => !sameDay(p.dateEnd, p.reportDate));

  console.log(`Niet-afgeronde projecten met deadline: ${candidates.length}`);
  console.log(`Te corrigeren (reportDate != dateEnd): ${toFix.length}\n`);

  for (const p of toFix) {
    console.log(
      `${apply ? 'FIX ' : '[dry]'} ${p.kenmerk} v${Number(p.version).toFixed(1)} ${p.title}  ` +
      `reportDate ${fmt(p.reportDate)} -> ${fmt(p.dateEnd)}`
    );
    if (apply) {
      await prisma.project.update({
        where: { id: p.id },
        data: { reportDate: p.dateEnd! },
      });
    }
  }

  if (!apply && toFix.length) {
    console.log('\nDry run. Voer opnieuw uit met --apply.');
  }

  await prisma.$disconnect();
})();
