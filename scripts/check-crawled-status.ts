import { prisma } from '../lib/prisma';

async function checkCrawledStatus() {
  const projectId = 'e7ab285e-b67f-4c01-b2bf-7f00cd58bcca';

  const urls = await prisma.projectScopeUrl.findMany({
    where: { projectId },
    select: {
      id: true,
      url: true,
      crawledAt: true,
      parentUrlId: true,
    },
    orderBy: { url: 'asc' },
  });

  console.log('\n=== SCOPE URLS ===\n');

  urls.forEach(url => {
    console.log(`URL: ${url.url}`);
    console.log(`  ID: ${url.id}`);
    console.log(`  Parent ID: ${url.parentUrlId || 'NULL (dit is een parent)'}`);
    console.log(`  Crawled At: ${url.crawledAt ? url.crawledAt.toISOString() : 'NIET GECRAWLD'}`);
    console.log('');
  });

  console.log(`\nTotaal: ${urls.length} URLs`);
  console.log(`Gecrawld: ${urls.filter(u => u.crawledAt).length}`);
  console.log(`Niet gecrawld: ${urls.filter(u => !u.crawledAt).length}`);
}

checkCrawledStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
