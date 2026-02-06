import { prisma } from '../lib/prisma';

async function showFullDescription() {
  const correctProjectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  const finding = await prisma.finding.findFirst({
    where: {
      projectId: correctProjectId,
      findingCode: 'B001',
    },
  });

  if (!finding) {
    console.log('❌ Finding B001 not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('Finding B001 - Full Description:');
  console.log('═'.repeat(100));
  console.log(finding.description);
  console.log('═'.repeat(100));

  await prisma.$disconnect();
}

showFullDescription();
