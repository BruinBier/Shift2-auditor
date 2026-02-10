import { fetchHtmlWithBrowser } from '../lib/crawler/browser-crawler';
import { runAllMVPTests } from '../lib/crawler/tests';

async function testYouTubeDetection() {
  const url = 'https://www.valkenswaard.nl/afscheid-burgemeester-looijen';

  console.log(`Fetching ${url}...`);

  const html = await fetchHtmlWithBrowser(url, {
    userAgent: 'Shift2-Auditor/1.0 (Accessibility Crawler; +https://shift2.nl)',
    waitTime: 3000,
  });

  console.log(`\nHTML fetched: ${html.length} bytes`);
  console.log('\n=== Running all tests ===\n');

  const testResults = runAllMVPTests(html);

  console.log(`Total tests run: ${testResults.length}`);
  console.log(`Tests found (positive): ${testResults.filter(t => t.found).length}\n`);

  // Filter to video-related tests
  const videoTests = testResults.filter(t =>
    t.testName.toLowerCase().includes('video') ||
    t.testName.toLowerCase().includes('youtube') ||
    t.testName.toLowerCase().includes('iframe')
  );

  console.log('=== Video/YouTube/Iframe Related Tests ===\n');
  videoTests.forEach(test => {
    const status = test.found ? '✓ FOUND' : '✗ NOT FOUND';
    console.log(`[${test.testId}] ${test.testName}`);
    console.log(`  Status: ${status}`);
    console.log(`  Count: ${test.count}`);
    if (test.found && test.details) {
      console.log(`  Details:`, JSON.stringify(test.details, null, 2));
    }
    console.log('');
  });

  // Specifically check test #132 (YouTube with keys disabled)
  const test132 = testResults.find(t => t.testId === '132');
  if (test132) {
    console.log('\n=== Test #132: YouTube with Keyboard Disabled ===');
    console.log(`Found: ${test132.found}`);
    console.log(`Count: ${test132.count}`);
    console.log(`Details:`, JSON.stringify(test132.details, null, 2));
  }

  // Check test #15 (general iframe test)
  const test15 = testResults.find(t => t.testId === '15');
  if (test15) {
    console.log('\n=== Test #15: General Iframe Test ===');
    console.log(`Found: ${test15.found}`);
    console.log(`Count: ${test15.count}`);
    console.log(`Details:`, JSON.stringify(test15.details, null, 2));
  }
}

testYouTubeDetection().catch(console.error);
