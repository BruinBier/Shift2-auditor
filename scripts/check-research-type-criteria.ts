import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCriteria() {
  const researchType = await prisma.researchType.findFirst({
    where: { name: 'WCAG 2.2 AA – aanvullend deelonderzoek content' },
    include: {
      criteria: {
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (!researchType) {
    console.log('Research type not found');
    return;
  }

  console.log('Research type:', researchType.name);
  console.log('Aantal criteria:', researchType.criteria.length);
  console.log('\nCriteria:');
  researchType.criteria.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.wcagCriterion.code} - ${c.wcagCriterion.titleNl}`);
  });
}

checkCriteria()
  .catch(console.error)
  .finally(() => prisma.$disconnect());