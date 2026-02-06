import { prisma } from '../lib/prisma';

async function checkQuickFinding() {
  const qf = await prisma.quickFinding.findUnique({
    where: { crawlerTestId: '6' },
  });

  console.log('QuickFinding voor PageContainsMultipleSameLinksTest (testId: 6):');
  console.log('');

  if (qf) {
    console.log('✅ QuickFinding bestaat al!');
    console.log('');
    console.log(`ID: ${qf.id}`);
    console.log(`Title: ${qf.title}`);
    console.log(`Criterion: ${qf.criterionCode}`);
    console.log(`Impact: ${qf.impact}`);
    console.log(`Responsibility: ${qf.responsibility}`);
    console.log(`Description: ${qf.description.substring(0, 100)}...`);
  } else {
    console.log('❌ QuickFinding bestaat nog NIET');
    console.log('');
    console.log('Deze moet nog aangemaakt worden voor automatische bevindingen.');
  }

  await prisma.$disconnect();
}

checkQuickFinding();
