import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixWierdenCriterion131() {
  console.log('Fixing criterion 1.3.1 for Wierden project...\n');

  // Find the Wierden project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { title: { contains: 'Wierden', mode: 'insensitive' } },
        { subject: { contains: 'Wierden', mode: 'insensitive' } },
      ],
    },
  });

  if (!project) {
    console.error('Project not found!');
    process.exit(1);
  }

  console.log(`Found project: ${project.title}`);

  // Find criterion 1.3.1
  const criterion = await prisma.wCAGCriterion.findFirst({
    where: {
      code: '1.3.1',
    },
  });

  if (!criterion) {
    console.error('Criterion 1.3.1 not found!');
    process.exit(1);
  }

  console.log(`Found criterion: ${criterion.code} - ${criterion.titleNl}`);

  // Find the assessment for this criterion in this project
  const assessment = await prisma.criterionAssessment.findFirst({
    where: {
      projectId: project.id,
      wcagCriterionId: criterion.id,
    },
  });

  if (!assessment) {
    console.error('Assessment not found!');
    process.exit(1);
  }

  console.log(`\nCurrent assessment status: ${assessment.status}`);

  // Check if there are any findings for this criterion
  const findings = await prisma.finding.findMany({
    where: {
      projectId: project.id,
      wcagCriterionId: criterion.id,
      OR: [
        { status: 'published' },
        { status: 'open' }
      ],
    },
  });

  console.log(`Findings count: ${findings.length}`);

  if (findings.length === 0 && assessment.status === 'failed') {
    console.log('\n⚠️  Criterion is marked as failed but has no findings.');
    console.log('Updating status to "passed"...\n');

    await prisma.criterionAssessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        status: 'passed',
      },
    });

    console.log('✓ Assessment updated successfully!');
    console.log(`  ${criterion.code} - ${criterion.titleNl}`);
    console.log(`  Old status: failed`);
    console.log(`  New status: passed`);
  } else {
    console.log('\nNo changes needed.');
  }

  await prisma.$disconnect();
}

fixWierdenCriterion131().catch((error) => {
  console.error('Error fixing criterion:', error);
  process.exit(1);
});