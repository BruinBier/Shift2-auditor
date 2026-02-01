/**
 * Test script for the crawler system
 * Run with: npx tsx scripts/test-crawler.ts
 */

import { runAllMVPTests } from '../lib/crawler/tests';
import { runTests } from '../lib/crawler/test-runner';

// Sample HTML with accessibility issues
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
</head>
<body>
  <h1>Test Page</h1>
  <h3>Skipped H2</h3>

  <img src="test.jpg">
  <img src="test2.jpg" alt="">
  <img src="test3.jpg" alt="This is a very long alt text that exceeds the recommended maximum length of 150 characters. It keeps going and going with unnecessary detail that makes it difficult for screen reader users to understand the content efficiently.">

  <a href="/page1">Read More</a>
  <a href="/page2">Read More</a>

  <a href="/empty"></a>

  <form>
    <input type="text" name="username">
    <input type="email" name="email">
    <button></button>
  </form>

  <table>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
  </table>

  <iframe src="https://www.youtube.com/embed/xyz"></iframe>
  <iframe src="https://player.vimeo.com/video/123?keyboard=0"></iframe>

  <h1></h1>

  <video autoplay controls src="test.mp4"></video>
  <audio autoplay src="test.mp3"></audio>
</body>
</html>
`;

async function testCrawler() {
  console.log('🚀 Testing Crawler System\n');
  console.log('=' .repeat(60));

  // Test 1: Run all tests
  console.log('\n📋 Test 1: Running all accessibility tests...\n');
  const results = await runTests(testHtml);

  console.log(`✓ Total tests run: ${results.totalTests}`);
  console.log(`✗ Issues found: ${results.testsFound}`);
  console.log(`✓ Tests passed: ${results.testsPassed}`);
  console.log('\n📊 Summary by severity:');
  console.log(`  🔴 Critical: ${results.summary.critical}`);
  console.log(`  🟠 High: ${results.summary.high}`);
  console.log(`  🟡 Medium: ${results.summary.medium}`);
  console.log(`  🔵 Low: ${results.summary.low}`);
  console.log(`  ℹ️  Informational: ${results.summary.informational}`);

  // Test 2: Show some found issues
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Test 2: Sample of detected issues:\n');

  const failedTests = results.results.filter(r => r.found);
  const criticalTests = failedTests.filter(r => r.details?.critical);

  console.log('Critical Issues:');
  criticalTests.slice(0, 5).forEach(test => {
    console.log(`  • ${test.testName} (Test #${test.testId})`);
    console.log(`    Count: ${test.count}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 3: Detailed results for specific tests:\n');

  // Show details for a few specific tests
  const testsToShow = ['48', '64', '34', '35', '2'];
  testsToShow.forEach(testId => {
    const test = results.results.find(r => r.testId === testId);
    if (test && test.found) {
      console.log(`\nTest #${test.testId}: ${test.testName}`);
      console.log(`  Found: ${test.found ? 'YES' : 'NO'}`);
      console.log(`  Count: ${test.count}`);
      console.log(`  Details:`, JSON.stringify(test.details, null, 2).substring(0, 200) + '...');
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Crawler test completed successfully!\n');
  console.log('You can now use the API endpoints to crawl real websites:');
  console.log('  POST /api/projects/[id]/scope-urls/[urlId]/crawler - Crawl single URL');
  console.log('  POST /api/projects/[id]/crawler - Crawl entire project');
  console.log('  POST /api/projects/[id]/crawler/discover - Discover & add URLs');
  console.log('  GET  /api/projects/[id]/crawler - Get crawler summary\n');
}

// Run the test
testCrawler().catch(console.error);