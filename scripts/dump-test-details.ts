import { prisma } from '../lib/prisma';

(async () => {
  const projectId = process.argv[2];
  const testName = process.argv[3];
  if (!projectId || !testName) {
    console.log('Usage: tsx scripts/dump-test-details.ts <projectId> <testName>');
    process.exit(1);
  }
  const samples = await prisma.sampleItem.findMany({
    where: { projectId },
    include: { crawlerResults: { where: { testName, found: true } } },
    orderBy: { orderIndex: 'asc' },
  });
  for (const s of samples) {
    const r = s.crawlerResults[0];
    if (!r) continue;
    console.log(`\n=== ${s.title} ===`);
    console.log(`URL: ${s.url}`);
    try {
      const details = JSON.parse(r.details || '{}');
      console.log(JSON.stringify(details, null, 2).slice(0, 2000));
    } catch {
      console.log(r.details?.slice(0, 1000));
    }
  }
  await prisma.$disconnect();
})();
