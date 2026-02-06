import { prisma } from '../lib/prisma';

async function checkNewUrl() {
  const url = await prisma.projectScopeUrl.findUnique({
    where: { id: '464612c5-7bd7-46c3-9f58-7cb7d1dd746f' }
  });

  console.log('URL Details:');
  console.log(JSON.stringify(url, null, 2));

  await prisma.$disconnect();
}

checkNewUrl();