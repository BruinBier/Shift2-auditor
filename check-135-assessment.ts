import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the criterion ID for 1.3.5
  const criterion = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.3.5' }
  });

  console.log('Criterium 1.3.5 ID:', criterion?.id);

  // Check if there's an assessment for this criterion in the project
  const assessment = await prisma.criterionAssessment.findFirst({
    where: {
      projectId: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804',
      wcagCriterionId: criterion?.id
    }
  });

  console.log('\nAssessment voor 1.3.5:', assessment ? 'JA' : 'NEE');
  if (assessment) {
    console.log('  Status:', assessment.status);
  } else {
    console.log('\n❌ Er is GEEN assessment voor criterium 1.3.5!');
    console.log('Dit zou kunnen verklaren waarom het niet verschijnt in het rapport.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);