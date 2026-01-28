import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUnknownToNotTested() {
  console.log('Starting to update unknown status to not_tested...\n');

  // Get all criterion assessments with status 'unknown'
  const unknownAssessments = await prisma.criterionAssessment.findMany({
    where: {
      status: 'unknown',
    },
    include: {
      project: {
        select: {
          title: true,
        },
      },
      wcagCriterion: {
        select: {
          code: true,
        },
      },
    },
  });

  console.log(`Found ${unknownAssessments.length} assessments with status 'unknown'\n`);

  if (unknownAssessments.length === 0) {
    console.log('✅ No assessments to update!');
    return;
  }

  // Update all assessments
  const result = await prisma.criterionAssessment.updateMany({
    where: {
      status: 'unknown',
    },
    data: {
      status: 'not_tested',
    },
  });

  console.log(`✅ Successfully updated ${result.count} assessments from 'unknown' to 'not_tested'`);

  // Show some examples
  console.log('\nExamples of updated assessments:');
  unknownAssessments.slice(0, 5).forEach((assessment) => {
    console.log(`  - ${assessment.project.title}: ${assessment.wcagCriterion.code}`);
  });

  if (unknownAssessments.length > 5) {
    console.log(`  ... and ${unknownAssessments.length - 5} more`);
  }
}

updateUnknownToNotTested()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });