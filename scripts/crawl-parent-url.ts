import { prisma } from '../lib/prisma';
import { runAllMVPTests } from '../lib/crawler/tests';

async function crawlParentUrl() {
  const parentUrlId = '4b7ad0cb-1e7c-4454-8038-e76b7ab89f75'; // urk.nl

  const scopeUrl = await prisma.projectScopeUrl.findUnique({
    where: { id: parentUrlId },
  });

  if (!scopeUrl) {
    console.error('Parent URL not found');
    return;
  }

  console.log(`Crawling parent URL: ${scopeUrl.url}`);

  // Fetch HTML
  const response = await fetch(scopeUrl.url, {
    headers: {
      'User-Agent': 'Shift2-Auditor/1.0 (Accessibility Crawler)',
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status}`);
    return;
  }

  const html = await response.text();
  console.log(`Fetched ${html.length} bytes`);

  // Run tests
  const testResults = runAllMVPTests(html);
  console.log(`Ran ${testResults.length} tests`);

  // Delete old results
  await prisma.crawlerResult.deleteMany({
    where: { scopeUrlId: parentUrlId },
  });

  // Save new results
  const results = testResults.map(test => ({
    scopeUrlId: parentUrlId,
    testId: test.testId,
    testName: test.testName,
    found: test.found,
    count: test.count,
    details: JSON.stringify(test.details || {}),
  }));

  await prisma.crawlerResult.createMany({
    data: results,
  });

  console.log(`Saved ${results.length} test results`);

  // Update crawledAt
  await prisma.projectScopeUrl.update({
    where: { id: parentUrlId },
    data: { crawledAt: new Date() },
  });

  console.log('✅ Parent URL crawled successfully!');
  console.log('Badge should now appear!');
}

crawlParentUrl()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
