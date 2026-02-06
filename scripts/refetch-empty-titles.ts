import { prisma } from '../lib/prisma';
import * as cheerio from 'cheerio';

async function refetchEmptyTitles() {
  // Get all URLs with empty or null titles
  const urls = await prisma.projectScopeUrl.findMany({
    where: {
      OR: [
        { title: null },
        { title: '' },
      ],
    },
  });

  console.log(`Found ${urls.length} URLs with empty titles\n`);

  let fixedCount = 0;

  for (const url of urls) {
    console.log(`Fetching: ${url.url}`);

    try {
      const response = await fetch(url.url, {
        headers: {
          'User-Agent': 'Shift2-Auditor/1.0 (Title Refetch)',
        },
      });

      if (!response.ok) {
        console.log(`  ✗ Failed: HTTP ${response.status}\n`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Get page title and clean it up
      let title = $('title').text().trim() || null;

      // Clean up title: remove trailing "Toegankelijkheid" or "Toegankelijk"
      if (title) {
        title = title.replace(/Toegankelijkheid$/gi, '');
        title = title.replace(/Toegankelijk$/gi, '');
        // Remove duplicate words at the end
        title = title.replace(/(\w{3,})\1+$/gi, '$1');
        // Remove trailing whitespace and periods
        title = title.trim().replace(/\s*\.\s*$/g, '');
        // If nothing left, keep original or set to null
        if (!title) {
          title = $('title').text().trim() || null;
        }
      }

      if (title) {
        console.log(`  ✓ Found title: "${title}"`);

        await prisma.projectScopeUrl.update({
          where: { id: url.id },
          data: { title },
        });

        fixedCount++;
      } else {
        console.log(`  ⚠ No title found in HTML`);
      }

      console.log('');

    } catch (error) {
      console.error(`  ✗ Error:`, error);
      console.log('');
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} empty titles`);

  await prisma.$disconnect();
}

refetchEmptyTitles();