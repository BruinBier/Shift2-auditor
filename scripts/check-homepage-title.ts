import { prisma } from '../lib/prisma';

async function checkHomepageTitle() {
  // Check database
  const url = await prisma.projectScopeUrl.findFirst({
    where: { url: 'https://www.valkenswaard.nl/' }
  });

  console.log('Database entry:');
  console.log(JSON.stringify(url, null, 2));
  console.log('\n---\n');

  // Fetch the actual page
  console.log('Fetching actual page...');
  try {
    const response = await fetch('https://www.valkenswaard.nl/', {
      headers: {
        'User-Agent': 'Shift2-Auditor/1.0',
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Extract title tag content
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'No title tag found';

      console.log('Actual page title:', title);
    } else {
      console.log('Failed to fetch:', response.status);
    }
  } catch (error) {
    console.error('Error fetching page:', error);
  }

  await prisma.$disconnect();
}

checkHomepageTitle();