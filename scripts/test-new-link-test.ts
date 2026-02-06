import { testPageContainsMultipleSameLinks } from '../lib/crawler/tests';
import { fetchHtmlWithBrowser, closeBrowser } from '../lib/crawler/browser-crawler';

async function testNewLinkTest() {
  const url = 'https://www.valkenswaard.nl/';

  console.log(`Testing new PageContainsMultipleSameLinksTest on: ${url}\n`);

  try {
    // Fetch HTML with Puppeteer
    const html = await fetchHtmlWithBrowser(url, {
      userAgent: 'Shift2-Auditor/1.0',
      waitTime: 3000,
    });

    console.log('HTML fetched, running test...\n');

    // Run the test with default config
    const result = testPageContainsMultipleSameLinks(html);

    console.log('=== TEST RESULT ===');
    console.log(`Test ID: ${result.testId}`);
    console.log(`Test Name: ${result.testName}`);
    console.log(`Found: ${result.found}`);
    console.log(`Count: ${result.count}`);
    console.log(`Classification: ${result.details.classification}`);
    console.log(`Total Links Analyzed: ${result.details.totalLinksAnalyzed}\n`);

    if (result.details.issues && result.details.issues.length > 0) {
      console.log('=== ISSUES FOUND ===\n');
      result.details.issues.forEach((issue: any, i: number) => {
        console.log(`${i + 1}. URL: ${issue.url}`);
        console.log(`   Link count: ${issue.linkCount}`);
        console.log(`   Different texts: ${issue.uniqueTexts.join(' | ')}`);
        console.log('   By context:');
        Object.entries(issue.contexts).forEach(([context, texts]: [string, any]) => {
          console.log(`     ${context}:`);
          texts.forEach((t: any) => {
            console.log(`       "${t.text}" (${t.count}×)`);
          });
        });
        console.log('');
      });
    } else {
      console.log('✓ No issues found!');
    }

    // Test with custom config (exclude less)
    console.log('\n=== TESTING WITH CUSTOM CONFIG (include more) ===\n');
    const customResult = testPageContainsMultipleSameLinks(html, {
      excludeHome: false,
      excludeHashLinks: false,
      excludeSkipLinks: false,
      ignoreQuery: false,
    });

    console.log(`Found: ${customResult.found}`);
    console.log(`Count: ${customResult.count}`);
    console.log(`Total Links Analyzed: ${customResult.details.totalLinksAnalyzed}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeBrowser();
  }
}

testNewLinkTest();
