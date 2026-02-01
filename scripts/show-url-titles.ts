import { prisma } from '../lib/prisma';

async function showUrlTitles() {
  const urls = await prisma.projectScopeUrl.findMany({
    where: {
      projectId: 'e7ab285e-b67f-4c01-b2bf-7f00cd58bcca',
    },
    select: {
      url: true,
      title: true,
    },
    orderBy: { url: 'asc' },
  });

  console.log('URL Titles:');
  for (const url of urls) {
    console.log(`\nURL: ${url.url}`);
    console.log(`Title: "${url.title}"`);
  }

  await prisma.$disconnect();
}

showUrlTitles();