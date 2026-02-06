import { prisma } from '../lib/prisma';

async function fullDetails() {
  const finding = await prisma.finding.findFirst({
    where: { findingCode: 'B001' },
  });

  if (!finding) {
    console.log('❌ Finding B001 not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('Full Finding B001 Details:');
  console.log(JSON.stringify(finding, null, 2));

  await prisma.$disconnect();
}

fullDetails();
