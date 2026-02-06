import { prisma } from '../lib/prisma';

async function findWozUrls() {
  const urls = await prisma.projectScopeUrl.findMany({
    where: {
      url: {
        contains: 'woz'
      }
    },
    select: {
      id: true,
      url: true,
      title: true,
      crawledAt: true,
      _count: {
        select: {
          crawlerResults: true
        }
      }
    }
  });

  console.log('WOZ-related URLs:\n');
  urls.forEach(url => {
    console.log(`ID: ${url.id}`);
    console.log(`URL: ${url.url}`);
    console.log(`Title: ${url.title}`);
    console.log(`Crawled: ${url.crawledAt}`);
    console.log(`Results: ${url._count.crawlerResults}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

findWozUrls();
