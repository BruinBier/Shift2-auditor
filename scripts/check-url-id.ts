import { prisma } from '../lib/prisma';

async function checkUrlId() {
  const url = await prisma.projectScopeUrl.findUnique({
    where: { id: '4d2680d2-2c08-4f1b-b952-b1c25677b7f7' }
  });

  console.log('URL Details:');
  console.log(JSON.stringify(url, null, 2));

  await prisma.$disconnect();
}

checkUrlId();