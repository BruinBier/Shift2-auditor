import { prisma } from '../lib/prisma';

async function listQuickFindings() {
  const qfs = await prisma.quickFinding.findMany({
    select: {
      id: true,
      title: true,
      crawlerTestId: true,
      description: true,
    },
    orderBy: { title: 'asc' },
  });

  console.log(`Total QuickFindings: ${qfs.length}\n`);

  qfs.forEach((qf, i) => {
    console.log(`${i + 1}. ${qf.title}`);
    console.log(`   TestID: ${qf.crawlerTestId || 'NULL'}`);
    console.log(`   ID: ${qf.id}`);
    console.log(`   Description (first 80 chars): ${qf.description.substring(0, 80)}...`);
    console.log('');
  });

  await prisma.$disconnect();
}

listQuickFindings();
