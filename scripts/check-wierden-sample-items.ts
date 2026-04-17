import { prisma } from '../lib/prisma';

async function checkSampleItems() {
  const sampleItems = await prisma.sampleItem.findMany({
    where: { projectId: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    orderBy: { orderIndex: 'asc' }
  });

  console.log('Total sample items:', sampleItems.length);
  console.log('\n');

  sampleItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.url) {
      console.log(`   URL: ${item.url}`);
    } else {
      console.log(`   URL: (geen URL)`);
    }
    console.log(`   Type: ${item.type}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkSampleItems().catch(console.error);