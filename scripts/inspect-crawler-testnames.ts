import { prisma } from '../lib/prisma';

(async () => {
  const projectId = process.argv[2] || '4d230920-ea82-4261-bcc0-cb858d8562bc';
  const samples = await prisma.sampleItem.findMany({
    where: { projectId },
    include: { crawlerResults: { where: { found: true } } },
  });
  const allTests = new Map<string, number>();
  let totalSamples = 0;
  let totalResults = 0;
  for (const s of samples) {
    totalSamples++;
    for (const r of s.crawlerResults) {
      totalResults++;
      allTests.set(r.testName, (allTests.get(r.testName) || 0) + 1);
    }
  }
  console.log(`Samples: ${totalSamples}, total positive results: ${totalResults}`);
  console.log(`\nUnique testNames in DB (sorted by count):`);
  for (const [name, count] of Array.from(allTests.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(4)}  ${name}`);
  }
  await prisma.$disconnect();
})();
