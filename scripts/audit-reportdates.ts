import { prisma } from '../lib/prisma';

const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

(async () => {
  const all = await prisma.project.findMany({
    select: {
      id: true, kenmerk: true, title: true, version: true, status: true,
      dateEnd: true, reportDate: true, parentProjectId: true,
    },
    orderBy: [{ status: 'asc' }, { title: 'asc' }, { version: 'asc' }],
  });

  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '—');

  // Projects where reportDate differs from dateEnd AND dateEnd exists.
  const mismatched = all.filter((p) => p.dateEnd && !sameDay(p.dateEnd, p.reportDate));

  console.log(`Totaal projecten: ${all.length}`);
  console.log(`reportDate != dateEnd (en dateEnd bestaat): ${mismatched.length}\n`);

  const byStatus = new Map<string, typeof mismatched>();
  for (const p of mismatched) {
    const arr = byStatus.get(p.status) ?? [];
    arr.push(p);
    byStatus.set(p.status, arr as any);
  }

  for (const [status, items] of byStatus) {
    console.log(`=== status: ${status} (${items.length}) ===`);
    for (const p of items) {
      console.log(
        `  ${p.kenmerk} v${Number(p.version).toFixed(1)}  ${p.title}\n` +
        `     deadline=${fmt(p.dateEnd)}  reportDate=${fmt(p.reportDate)}  ${p.parentProjectId ? '(herinspectie)' : '(nulmeting)'}`
      );
    }
    console.log('');
  }

  await prisma.$disconnect();
})();
