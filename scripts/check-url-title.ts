import { prisma } from '../lib/prisma';

async function checkUrlTitle() {
  const url = await prisma.projectScopeUrl.findUnique({
    where: { id: 'c0951f68-6420-4fc1-88a3-f15b6165090a' },
  });

  if (url) {
    console.log('URL:', url.url);
    console.log('Title:', url.title);
  } else {
    console.log('URL not found');
  }

  await prisma.$disconnect();
}

checkUrlTitle();