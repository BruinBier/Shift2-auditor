import { prisma } from '../lib/prisma';

async function checkAboutResearch() {
  const project = await prisma.project.findUnique({
    where: { id: '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee' },
    select: {
      aboutResearchText: true
    }
  });

  console.log('aboutResearchText:');
  console.log(project?.aboutResearchText || 'NULL');

  await prisma.$disconnect();
}

checkAboutResearch();