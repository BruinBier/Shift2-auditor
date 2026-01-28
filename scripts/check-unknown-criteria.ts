import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = '0f8b21e6-6b1b-4ef7-bbec-70e79731fe13';

  console.log(`Checking unknown criteria for project ${projectId}...`);

  const assessments = await prisma.criterionAssessment.findMany({
    where: {
      projectId: projectId,
      status: 'unknown',
    },
    include: {
      wcagCriterion: true,
    },
  });

  console.log(`Found ${assessments.length} unknown criteria`);

  // Check for findings for each unknown criterion
  for (const assessment of assessments) {
    const findings = await prisma.finding.findMany({
      where: {
        projectId: projectId,
        wcagCriterionId: assessment.wcagCriterionId,
      },
    });

    console.log(`${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}: ${findings.length} findings`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });