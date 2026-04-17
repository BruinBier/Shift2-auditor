import { prisma } from '../lib/prisma';

async function checkCriterionUrl() {
  const criterion = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.3.3' },
  });

  if (criterion) {
    console.log('Criterion 1.3.3:');
    console.log(JSON.stringify(criterion, null, 2));
  }

  await prisma.$disconnect();
}

checkCriterionUrl();
