import { prisma } from '../lib/prisma';

async function debug() {
  console.log('1. Checking QuickFinding for testId 6...\n');

  const qf = await prisma.quickFinding.findUnique({
    where: { crawlerTestId: '6' },
  });

  if (qf) {
    console.log(`✓ QuickFinding ID: ${qf.id}`);
    console.log(`  Title: ${qf.title}`);
    console.log(`  Description (first 100 chars): ${qf.description.substring(0, 100)}...`);
  } else {
    console.log('❌ No QuickFinding found for testId 6');
  }

  console.log('\n2. Checking Finding B001...\n');

  const finding = await prisma.finding.findFirst({
    where: { findingCode: 'B001' },
    include: {
      quickFinding: true,
      affectedUrls: true,
    },
  });

  if (finding) {
    console.log(`✓ Finding Code: ${finding.findingCode}`);
    console.log(`  QuickFinding ID: ${finding.quickFindingId}`);
    console.log(`  QuickFinding Title: ${finding.quickFinding?.title}`);
    console.log(`  AffectedUrls count: ${finding.affectedUrls.length}`);
  } else {
    console.log('❌ No finding B001 found');
  }

  console.log('\n3. Checking CrawlerResult for WOZ page...\n');

  const scopeUrlId = '62573e58-c989-406b-895c-4e4ca1c70142';

  const crawlerResult = await prisma.crawlerResult.findFirst({
    where: {
      scopeUrlId,
      testId: '6',
    },
  });

  if (crawlerResult) {
    console.log(`✓ CrawlerResult found`);
    console.log(`  Test: ${crawlerResult.testName}`);
    console.log(`  Found: ${crawlerResult.found}`);
    console.log(`  Count: ${crawlerResult.count}`);
    console.log(`  Details: ${crawlerResult.details?.substring(0, 200)}...`);
  } else {
    console.log('❌ No crawler result found');
  }

  await prisma.$disconnect();
}

debug();
