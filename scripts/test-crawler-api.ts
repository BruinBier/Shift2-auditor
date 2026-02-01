/**
 * Test the crawler API endpoints
 * This script will:
 * 1. Find or create a test project
 * 2. Add a test URL to scope
 * 3. Run the crawler on that URL
 * 4. Show the results
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCrawlerAPI() {
  console.log('🧪 Testing Crawler API Integration\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Find an existing project or show available projects
    console.log('\n📋 Step 1: Finding projects...\n');

    const projects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        kenmerk: true,
      },
    });

    if (projects.length === 0) {
      console.log('❌ No projects found in database.');
      console.log('   Please create a project first via the UI.\n');
      return;
    }

    console.log('Found projects:');
    projects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.kenmerk || p.id.substring(0, 8)})`);
    });

    const testProject = projects[0];
    console.log(`\n✓ Using project: "${testProject.title}"`);
    console.log(`  ID: ${testProject.id}\n`);

    // Step 2: Check for scope URLs
    console.log('='.repeat(60));
    console.log('\n📋 Step 2: Checking scope URLs...\n');

    const scopeUrls = await prisma.projectScopeUrl.findMany({
      where: { projectId: testProject.id },
      take: 5,
    });

    if (scopeUrls.length === 0) {
      console.log('⚠️  No scope URLs found for this project.');
      console.log('   Adding a test URL...\n');

      // Add a test URL
      const testUrl = await prisma.projectScopeUrl.create({
        data: {
          projectId: testProject.id,
          url: 'https://example.com',
          title: 'Test URL - Example.com',
          inScope: true,
        },
      });

      console.log(`✓ Added test URL: ${testUrl.url}`);
      console.log(`  ID: ${testUrl.id}\n`);

      scopeUrls.push(testUrl);
    } else {
      console.log('Found scope URLs:');
      scopeUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.url}`);
        console.log(`     Crawled: ${url.crawledAt ? '✓ Yes' : '✗ No'}`);
      });
    }

    const testUrl = scopeUrls[0];
    console.log(`\n✓ Using URL: ${testUrl.url}`);
    console.log(`  ID: ${testUrl.id}\n`);

    // Step 3: Show API endpoint URLs
    console.log('='.repeat(60));
    console.log('\n🚀 Step 3: API Endpoints to Test\n');

    const baseUrl = 'http://localhost:3000';

    console.log('You can now test these endpoints:\n');

    console.log('1️⃣ Crawl this single URL:');
    console.log(`   POST ${baseUrl}/api/projects/${testProject.id}/scope-urls/${testUrl.id}/crawler\n`);

    console.log('2️⃣ Get results for this URL:');
    console.log(`   GET  ${baseUrl}/api/projects/${testProject.id}/scope-urls/${testUrl.id}/crawler\n`);

    console.log('3️⃣ Crawl entire project:');
    console.log(`   POST ${baseUrl}/api/projects/${testProject.id}/crawler`);
    console.log('   Body: { "maxDepth": 2, "maxPages": 100, "delayMs": 1000 }\n');

    console.log('4️⃣ Get project crawler summary:');
    console.log(`   GET  ${baseUrl}/api/projects/${testProject.id}/crawler\n`);

    console.log('5️⃣ Discover URLs from a website:');
    console.log(`   POST ${baseUrl}/api/projects/${testProject.id}/crawler/discover`);
    console.log('   Body: { "startUrl": "https://example.com", "maxDepth": 2 }\n');

    // Step 4: Show curl commands
    console.log('='.repeat(60));
    console.log('\n📝 Step 4: Ready-to-use CURL Commands\n');

    console.log('Copy and paste these commands to test:\n');

    console.log('# Crawl single URL');
    console.log(`curl -X POST "${baseUrl}/api/projects/${testProject.id}/scope-urls/${testUrl.id}/crawler"\n`);

    console.log('# Get results');
    console.log(`curl "${baseUrl}/api/projects/${testProject.id}/scope-urls/${testUrl.id}/crawler"\n`);

    console.log('# Crawl entire project');
    console.log(`curl -X POST "${baseUrl}/api/projects/${testProject.id}/crawler" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"maxDepth":2,"maxPages":10,"delayMs":1000}'\n`);

    console.log('# Get summary');
    console.log(`curl "${baseUrl}/api/projects/${testProject.id}/crawler"\n`);

    // Step 5: Check if we have crawler results already
    console.log('='.repeat(60));
    console.log('\n📊 Step 5: Current Crawler Results\n');

    const existingResults = await prisma.crawlerResult.findMany({
      where: { scopeUrlId: testUrl.id },
      take: 5,
    });

    if (existingResults.length === 0) {
      console.log('⚠️  No crawler results yet for this URL.');
      console.log('   Run the crawler using the curl command above!\n');
    } else {
      console.log(`✓ Found ${existingResults.length} test results:`);
      existingResults.forEach(result => {
        const status = result.found ? '✗ FAIL' : '✓ PASS';
        console.log(`  ${status} - ${result.testName} (count: ${result.count})`);
      });

      // Count issues
      const totalResults = await prisma.crawlerResult.count({
        where: { scopeUrlId: testUrl.id },
      });

      const issuesFound = await prisma.crawlerResult.count({
        where: {
          scopeUrlId: testUrl.id,
          found: true,
        },
      });

      console.log(`\n📈 Summary: ${issuesFound}/${totalResults} tests found issues\n`);
    }

    console.log('='.repeat(60));
    console.log('\n✅ Setup Complete!\n');
    console.log('Next steps:');
    console.log('  1. Make sure your Next.js app is running (npm run dev)');
    console.log('  2. Use the curl commands above to test the API');
    console.log('  3. Or visit the project in the UI to see results\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCrawlerAPI();