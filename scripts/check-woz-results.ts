import { prisma } from '../lib/prisma';

async function checkWozResults() {
  const scopeUrlId = '62573e58-c989-406b-895c-4e4ca1c70142';

  // Get the URL
  const scopeUrl = await prisma.projectScopeUrl.findUnique({
    where: { id: scopeUrlId }
  });

  console.log('URL Details:');
  console.log(`  URL: ${scopeUrl?.url}`);
  console.log(`  Title: ${scopeUrl?.title}`);
  console.log(`  Crawled At: ${scopeUrl?.crawledAt}\n`);

  // Get all crawler results
  const allResults = await prisma.crawlerResult.findMany({
    where: { scopeUrlId: scopeUrlId },
    orderBy: { testName: 'asc' }
  });

  console.log(`Total tests found: ${allResults.length}\n`);

  // Find PageContainsMultipleSameLinksTest
  const linkTest = allResults.find(r => r.testId === '6');

  if (linkTest) {
    console.log('PageContainsMultipleSameLinksTest Result:');
    console.log(`  Test ID: ${linkTest.testId}`);
    console.log(`  Test Name: ${linkTest.testName}`);
    console.log(`  Found: ${linkTest.found}`);
    console.log(`  Count: ${linkTest.count}`);
    console.log(`  Details:`);

    if (linkTest.details) {
      try {
        const details = JSON.parse(linkTest.details);
        console.log(JSON.stringify(details, null, 2));
      } catch {
        console.log('    (Invalid JSON or null)');
      }
    } else {
      console.log('    (No details)');
    }
  } else {
    console.log('❌ PageContainsMultipleSameLinksTest NOT FOUND in database!');
    console.log('\nThis means the page was crawled with the OLD code.');
    console.log('You need to RE-CRAWL this page to see the new test results.');
  }

  // Show all tests with found=true
  console.log('\n=== All Tests with Issues ===');
  const foundTests = allResults.filter(r => r.found);
  foundTests.forEach(test => {
    console.log(`  - ${test.testName}: ${test.count} issues`);
  });

  await prisma.$disconnect();
}

checkWozResults();
