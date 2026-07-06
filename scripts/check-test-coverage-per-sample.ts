import { prisma } from '../lib/prisma';

(async () => {
  const projectId = process.argv[2];
  const testName = process.argv[3];
  if (!projectId || !testName) {
    console.log('Usage: tsx scripts/check-test-coverage-per-sample.ts <projectId> <testName>');
    process.exit(1);
  }
  const samples = await prisma.sampleItem.findMany({
    where: { projectId },
    include: {
      crawlerResults: {
        where: { testName },
      },
    },
    orderBy: { orderIndex: 'asc' },
  });

  console.log(`Project: ${projectId}`);
  console.log(`Test: ${testName}`);
  console.log(`Samples in DB: ${samples.length}`);
  console.log();
  let withResult = 0;
  let withIssue = 0;
  for (const s of samples) {
    const r = s.crawlerResults[0];
    let status = '○ niet getest';
    if (r) {
      withResult++;
      if (r.found) {
        withIssue++;
        status = `⚠ ${r.count} voorval(len)`;
      } else {
        status = '✓ OK';
      }
    }
    console.log(`  ${status.padEnd(25)} ${s.title || s.id}`);
  }
  console.log();
  console.log(`Resultaat: ${withResult} samples getest, ${withIssue} met issues`);
  await prisma.$disconnect();
})();
