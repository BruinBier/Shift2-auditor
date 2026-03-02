import { prisma } from '../lib/prisma';

async function checkResearchType() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      subject: true,
      researchType: true,
    },
  });

  console.log('Project details:');
  console.log('ID:', project?.id);
  console.log('Title:', project?.title);
  console.log('Subject:', project?.subject);
  console.log('Research Type (raw):', JSON.stringify(project?.researchType));
  console.log('Research Type (string):', project?.researchType);

  // Also check what research types exist in the database
  const researchTypes = await prisma.researchType.findMany({
    select: { name: true },
  });

  console.log('\nAll available research types:');
  researchTypes.forEach(rt => {
    console.log(`- "${rt.name}"`);
  });

  await prisma.$disconnect();
}

checkResearchType().catch(console.error);