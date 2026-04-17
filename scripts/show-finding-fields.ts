import { prisma } from '../lib/prisma';

async function showFields() {
  const finding = await prisma.finding.findFirst({
    where: { findingCode: 'B002' },
  });

  if (finding) {
    console.log('Finding B002 fields:');
    console.log(JSON.stringify(finding, null, 2));
  }

  await prisma.$disconnect();
}

showFields();
