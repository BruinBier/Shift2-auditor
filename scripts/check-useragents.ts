import { prisma } from '../lib/prisma';

async function checkUserAgents() {
  const project = await prisma.project.findUnique({
    where: { id: '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee' },
    select: {
      userAgents: true
    }
  });

  console.log('userAgents field:');
  console.log(project?.userAgents);
  console.log('\nLength:', project?.userAgents?.length);
  console.log('\nFirst 200 chars:', project?.userAgents?.substring(0, 200));

  await prisma.$disconnect();
}

checkUserAgents();