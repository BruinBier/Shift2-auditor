import { fetchHtmlWithBrowser, closeBrowser } from '../lib/crawler/browser-crawler';
import * as cheerio from 'cheerio';

async function inspectCookieConsent() {
  const url = 'https://www.valkenswaard.nl/werken-bij-de-gemeente-valkenswaard';

  console.log(`Inspecting cookie consent on: ${url}\n`);

  try {
    const html = await fetchHtmlWithBrowser(url, {
      userAgent: 'Shift2-Auditor/1.0',
      waitTime: 2000,
    });

    const $ = cheerio.load(html);

    console.log('=== Cookie/Consent Related Elements ===\n');

    // Check for elements with "cookie" or "consent" in class/id
    const cookieElements = $('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], [class*="Cookie"], [class*="Consent"]');

    console.log(`Found ${cookieElements.length} elements with cookie/consent in class/id:\n`);

    cookieElements.each((i, el) => {
      if (i < 10) {
        const $el = $(el);
        console.log(`Element ${i + 1}: <${el.tagName}>`);
        console.log(`  Class: ${$el.attr('class')}`);
        console.log(`  ID: ${$el.attr('id')}`);

        // Check for buttons inside
        const buttons = $el.find('button');
        if (buttons.length > 0) {
          console.log(`  Contains ${buttons.length} button(s):`);
          buttons.each((j, btn) => {
            const text = $(btn).text().trim();
            console.log(`    - "${text}" (class: ${$(btn).attr('class')})`);
          });
        }

        // Check for links inside
        const links = $el.find('a');
        if (links.length > 0) {
          console.log(`  Contains ${links.length} link(s):`);
          links.slice(0, 3).each((j, link) => {
            const text = $(link).text().trim();
            console.log(`    - "${text}" (class: ${$(link).attr('class')})`);
          });
        }

        console.log('');
      }
    });

    // Look for all buttons on the page
    console.log('\n=== All Buttons on Page ===\n');
    const allButtons = $('button');
    console.log(`Total buttons found: ${allButtons.length}\n`);

    allButtons.each((i, btn) => {
      if (i < 20) {
        const text = $(btn).text().trim().substring(0, 50);
        const btnClass = $(btn).attr('class');
        const btnId = $(btn).attr('id');
        if (text || btnClass?.includes('cookie') || btnClass?.includes('consent')) {
          console.log(`Button ${i + 1}:`);
          console.log(`  Text: "${text}"`);
          console.log(`  Class: ${btnClass}`);
          console.log(`  ID: ${btnId}`);
          console.log('');
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeBrowser();
  }
}

inspectCookieConsent();