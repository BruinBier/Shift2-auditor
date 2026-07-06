import { prisma } from '../lib/prisma';

(async () => {
  const projectId = process.argv[2];
  const testName = process.argv[3];
  if (!projectId || !testName) {
    console.log('Usage: tsx scripts/dump-all-results.ts <projectId> <testName>');
    process.exit(1);
  }
  const samples = await prisma.sampleItem.findMany({
    where: { projectId },
    include: { crawlerResults: { where: { testName } } },
    orderBy: { orderIndex: 'asc' },
  });
  for (const s of samples) {
    const r = s.crawlerResults[0];
    if (!r) {
      console.log(`\n=== ${s.title} === niet getest`);
      continue;
    }
    console.log(`\n=== ${s.title} === found=${r.found} count=${r.count}`);
    try {
      const details = JSON.parse(r.details || '{}');
      if (details.landmarksByType) {
        for (const [type, info] of Object.entries(details.landmarksByType)) {
          console.log(`  ${type}: ${JSON.stringify(info)}`);
        }
      } else {
        console.log(JSON.stringify(details, null, 2).slice(0, 800));
      }
    } catch {
      console.log(r.details?.slice(0, 400));
    }
  }
  await prisma.$disconnect();
})();
