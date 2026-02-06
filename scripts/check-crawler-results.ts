import { prisma } from '../lib/prisma';

async function checkCrawlerResults() {
  // Find the URL
  const scopeUrl = await prisma.projectScopeUrl.findFirst({
    where: {
      url: 'https://www.valkenswaard.nl/werken-bij-de-gemeente-valkenswaard',
    },
    include: {
      crawlerResults: {
        where: { found: true },
        orderBy: { testName: 'asc' },
      },
    },
  });

  if (!scopeUrl) {
    console.log('URL not found in database');
    return;
  }

  console.log(`URL: ${scopeUrl.url}`);
  console.log(`Title: ${scopeUrl.title}`);
  console.log(`Crawled at: ${scopeUrl.crawledAt}`);
  console.log(`\nCrawler results found (${scopeUrl.crawlerResults.length} issues):\n`);

  scopeUrl.crawlerResults.forEach(result => {
    console.log(`- [${result.testId}] ${result.testName}: ${result.count} found`);
  });

  // Check if any video-related tests found anything
  console.log('\n--- Video-related tests ---');
  const videoTests = scopeUrl.crawlerResults.filter(r =>
    r.testName.toLowerCase().includes('video') ||
    r.testName.toLowerCase().includes('iframe')
  );

  if (videoTests.length === 0) {
    console.log('No video-related tests found anything');
  } else {
    videoTests.forEach(result => {
      console.log(`- [${result.testId}] ${result.testName}: ${result.count}`);
      if (result.details) {
        console.log('  Details:', JSON.parse(result.details));
      }
    });
  }

  await prisma.$disconnect();
}

checkCrawlerResults();