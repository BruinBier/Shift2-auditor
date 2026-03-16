import { prisma } from '../lib/prisma';

async function checkResearchType() {
  const project = await prisma.project.findUnique({
    where: { id: '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee' },
    select: {
      researchType: true
    }
  });

  console.log('Research type:', project?.researchType);

  const researchTypeData = await prisma.researchType.findUnique({
    where: { name: project?.researchType || '' },
    select: {
      reportIntroHeader: true,
      type: true
    }
  });

  console.log('\nResearch type data:');
  console.log('Type:', researchTypeData?.type);
  console.log('Report intro header:', researchTypeData?.reportIntroHeader);

  await prisma.$disconnect();
}

checkResearchType();