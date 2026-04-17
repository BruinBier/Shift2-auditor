import { prisma } from '../lib/prisma';

async function fixUserAgents() {
  await prisma.project.update({
    where: { id: '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee' },
    data: {
      userAgents: 'Google Chrome 145 (primair);\nMozilla Firefox 147;\nMicrosoft Edge 145;\nNVDA (Windows) in combinatie met Google Chrome;'
    }
  });

  console.log('Updated userAgents field with default browser list');

  await prisma.$disconnect();
}

fixUserAgents();