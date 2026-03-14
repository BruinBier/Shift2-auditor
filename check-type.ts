import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkResearchType() {
  const project = await prisma.project.findUnique({
    where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    select: {
      title: true,
      researchType: true,
    },
  });

  if (project) {
    console.log('Project:', project.title);
    console.log('Research Type:', JSON.stringify(project.researchType));
    console.log('Expected:', 'Toegankelijkheidsonderzoek formulieren');
    console.log('Match?:', project.researchType === 'Toegankelijkheidsonderzoek formulieren');
  } else {
    console.log('Project not found');
  }

  await prisma.$disconnect();
}

checkResearchType();
