import { testPageContainsMultipleSameLinks } from '../lib/crawler/tests';
import { fetchHtmlWithBrowser, closeBrowser } from '../lib/crawler/browser-crawler';

async function testWozPage() {
  const url = 'https://www.valkenswaard.nl/woz-waarde';

  console.log(`Testing WOZ-waarde page: ${url}\n`);

  try {
    // Fetch HTML
    const html = await fetchHtmlWithBrowser(url, {
      userAgent: 'Shift2-Auditor/1.0',
      waitTime: 3000,
    });

    console.log('HTML fetched, running test...\n');

    // Run the test
    const result = testPageContainsMultipleSameLinks(html);

    console.log('=== TEST RESULT ===');
    console.log(`Found: ${result.found}`);
    console.log(`Count: ${result.count}`);
    console.log(`Total Links Analyzed: ${result.details.totalLinksAnalyzed}\n`);

    if (result.details.issues && result.details.issues.length > 0) {
      console.log('=== ISSUES FOUND ===\n');
      result.details.issues.forEach((issue: any, i: number) => {
        console.log(`${i + 1}. URL: ${issue.url}`);
        console.log(`   Different texts: ${issue.uniqueTexts.join(' | ')}`);
        console.log(`   Link count: ${issue.linkCount}`);
        console.log('   Contexts:');
        Object.entries(issue.contexts).forEach(([ctx, texts]: [string, any]) => {
          console.log(`     ${ctx}:`);
          texts.forEach((t: any) => {
            console.log(`       "${t.text}" (${t.count}×)`);
          });
        });
        console.log('');
      });
    } else {
      console.log('✓ No issues found on this page!');
      console.log('\nThis could mean:');
      console.log('  1. All links to the same URL use the same text');
      console.log('  2. Duplicate links were filtered (home, hash, mailto/tel)');
      console.log('  3. There are no duplicate links at all');
    }

    // Test with LESS filtering to see if we catch more
    console.log('\n=== TESTING WITH MINIMAL FILTERING ===\n');
    const minimalResult = testPageContainsMultipleSameLinks(html, {
      excludeHome: false,
      excludeHashLinks: false,
      excludeSkipLinks: false,
      ignoreQuery: false,
    });

    console.log(`Found with minimal filtering: ${minimalResult.found}`);
    console.log(`Count: ${minimalResult.count}`);
    console.log(`Total Links Analyzed: ${minimalResult.details.totalLinksAnalyzed}`);

    if (minimalResult.details.issues && minimalResult.details.issues.length > 0) {
      console.log('\n=== ISSUES WITH MINIMAL FILTERING ===\n');
      minimalResult.details.issues.forEach((issue: any, i: number) => {
        console.log(`${i + 1}. URL: ${issue.url}`);
        console.log(`   Different texts: ${issue.uniqueTexts.join(' | ')}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeBrowser();
  }
}

testWozPage();
