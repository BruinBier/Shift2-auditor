import { fetchHtmlWithBrowser, closeBrowser } from '../lib/crawler/browser-crawler';
import * as cheerio from 'cheerio';

async function debugWerkenBijLinks() {
  const url = 'https://www.valkenswaard.nl/woz-waarde';

  console.log(`Debugging werken bij / vacatures links on: ${url}\n`);

  try {
    const html = await fetchHtmlWithBrowser(url, {
      userAgent: 'Shift2-Auditor/1.0',
      waitTime: 3000,
    });

    const $ = cheerio.load(html);

    // Find all links containing "werken" or "vacature"
    const relevantLinks: any[] = [];

    $('a[href]').each((i, link) => {
      const $link = $(link);
      const href = $link.attr('href') || '';
      const text = $link.text().trim().toLowerCase();

      if (text.includes('werken') || text.includes('vacature')) {
        // Determine context
        let context = 'other';
        if ($link.closest('header').length > 0) context = 'header';
        else if ($link.closest('nav').length > 0) context = 'navigation';
        else if ($link.closest('footer').length > 0) context = 'footer';
        else if ($link.closest('main, article').length > 0) context = 'main';

        relevantLinks.push({
          href: href,
          text: text,
          context: context,
          fullHtml: $link.toString().substring(0, 150)
        });
      }
    });

    console.log('=== LINKS WITH "werken" OR "vacature" ===\n');

    if (relevantLinks.length === 0) {
      console.log('❌ NO LINKS FOUND with "werken" or "vacature" in text!');
      console.log('\nThis means:');
      console.log('  1. The page does not have these links');
      console.log('  2. OR the link text is different (e.g., with icons/images)');
      console.log('  3. OR the links are loaded via JavaScript later');

      // Check if links exist at all
      console.log('\n=== Checking for ANY footer links ===');
      const footerLinks = $('footer a[href]');
      console.log(`Found ${footerLinks.length} links in footer:`);
      footerLinks.slice(0, 10).each((i, link) => {
        const $link = $(link);
        console.log(`  ${i + 1}. "${$link.text().trim()}" → ${$link.attr('href')}`);
      });

      console.log('\n=== Checking for ANY navigation links ===');
      const navLinks = $('nav a[href], header a[href]');
      console.log(`Found ${navLinks.length} links in nav/header:`);
      navLinks.slice(0, 10).each((i, link) => {
        const $link = $(link);
        console.log(`  ${i + 1}. "${$link.text().trim()}" → ${$link.attr('href')}`);
      });

    } else {
      console.log(`Found ${relevantLinks.length} relevant links:\n`);

      relevantLinks.forEach((link, i) => {
        console.log(`${i + 1}. "${link.text}"`);
        console.log(`   URL: ${link.href}`);
        console.log(`   Context: ${link.context}`);
        console.log(`   HTML: ${link.fullHtml}`);
        console.log('');
      });

      // Group by href
      const grouped: Record<string, any[]> = {};
      relevantLinks.forEach(link => {
        const normalizedHref = link.href.split('#')[0].replace(/\/$/, '');
        if (!grouped[normalizedHref]) grouped[normalizedHref] = [];
        grouped[normalizedHref].push(link);
      });

      console.log('=== GROUPED BY URL ===\n');
      Object.entries(grouped).forEach(([href, links]) => {
        if (links.length > 1) {
          const uniqueTexts = new Set(links.map(l => l.text));
          if (uniqueTexts.size > 1) {
            console.log(`🔴 ISSUE FOUND: ${href}`);
            console.log(`   Different texts: ${Array.from(uniqueTexts).join(' | ')}`);
            links.forEach(l => {
              console.log(`     - "${l.text}" in ${l.context}`);
            });
            console.log('');
          }
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeBrowser();
  }
}

debugWerkenBijLinks();
