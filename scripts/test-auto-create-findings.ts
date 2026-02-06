import { prisma } from '../lib/prisma';

async function testAutoCreateFindings() {
  const scopeUrlId = '62573e58-c989-406b-895c-4e4ca1c70142'; // WOZ-waarde page
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Testing auto-create findings for WOZ-waarde page...\n');

  // Get the scope URL
  const scopeUrl = await prisma.projectScopeUrl.findUnique({
    where: { id: scopeUrlId },
  });

  console.log(`URL: ${scopeUrl?.url}`);
  console.log(`Title: ${scopeUrl?.title}\n`);

  // Get crawler results that found issues
  const crawlerResults = await prisma.crawlerResult.findMany({
    where: {
      scopeUrlId,
      found: true,
    },
  });

  console.log(`Found ${crawlerResults.length} crawler results with issues:`);
  crawlerResults.forEach(result => {
    console.log(`  - ${result.testName} (testId: ${result.testId}): ${result.count} issues`);
  });
  console.log('');

  // Get QuickFindings for these tests
  const testIds = crawlerResults.map(r => r.testId);
  const quickFindings = await prisma.quickFinding.findMany({
    where: {
      crawlerTestId: {
        in: testIds,
      },
    },
  });

  console.log(`Found ${quickFindings.length} QuickFinding templates:`);
  quickFindings.forEach(qf => {
    console.log(`  - ${qf.title} (testId: ${qf.crawlerTestId})`);
  });
  console.log('');

  // Check existing findings
  const existingFindings = await prisma.finding.findMany({
    where: {
      projectId,
      quickFindingId: {
        in: quickFindings.map(qf => qf.id),
      },
    },
    include: {
      affectedUrls: true,
    },
  });

  console.log(`Existing findings: ${existingFindings.length}`);
  existingFindings.forEach(f => {
    console.log(`  - ${f.findingCode}: ${f.description.substring(0, 60)}...`);
    console.log(`    Affected URLs: ${f.affectedUrls.length}`);
  });
  console.log('');

  console.log('✅ Ready to test! The API endpoint will:');
  console.log(`   1. Find ${crawlerResults.length} crawler results with issues`);
  console.log(`   2. Match ${quickFindings.length} QuickFinding templates`);
  if (existingFindings.length > 0) {
    console.log(`   3. Update ${existingFindings.length} existing finding(s) with this URL`);
  } else {
    console.log(`   3. Create ${quickFindings.length} new finding(s)`);
  }

  await prisma.$disconnect();
}

testAutoCreateFindings();
