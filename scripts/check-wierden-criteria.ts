import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWierdenCriteria() {
  console.log('Looking for project "deelonderzoek formulieren Wierden"...\n');

  // Find the project
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { contains: 'Wierden', mode: 'insensitive' } },
        { subject: { contains: 'Wierden', mode: 'insensitive' } },
      ],
    },
    include: {
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
        orderBy: {
          wcagCriterion: {
            code: 'asc',
          },
        },
      },
      findings: {
        where: {
          OR: [{ status: 'published' }, { status: 'open' }],
        },
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  console.log(`Found ${projects.length} project(s) matching "Wierden":\n`);

  for (const project of projects) {
    console.log(`Project: ${project.title}`);
    console.log(`Subject: ${project.subject}`);
    console.log(`Research Type: ${project.researchType}`);
    console.log(`\n--- Criterion Assessments (${project.criterionAssessments.length} total) ---\n`);

    // Group by status
    const byStatus: Record<string, any[]> = {};
    for (const assessment of project.criterionAssessments) {
      if (!byStatus[assessment.status]) {
        byStatus[assessment.status] = [];
      }
      byStatus[assessment.status].push(assessment);
    }

    console.log('Summary by status:');
    for (const [status, assessments] of Object.entries(byStatus)) {
      console.log(`  ${status}: ${assessments.length}`);
    }

    console.log('\n--- Failed Criteria (with findings count) ---\n');
    const failedCriteria = project.criterionAssessments.filter(
      (a) => a.status === 'failed'
    );

    for (const assessment of failedCriteria) {
      const findingsCount = project.findings.filter(
        (f) => f.wcagCriterionId === assessment.wcagCriterion.id
      ).length;

      console.log(
        `${assessment.wcagCriterion.code} ${assessment.wcagCriterion.level} - ${assessment.wcagCriterion.titleNl}`
      );
      console.log(`  Status: ${assessment.status}`);
      console.log(`  Findings: ${findingsCount}`);
      console.log();
    }

    console.log('\n--- Findings without matching criteria ---\n');
    const findingsWithoutMatchingCriteria = project.findings.filter((finding) => {
      return !project.criterionAssessments.some(
        (assessment) =>
          assessment.wcagCriterionId === finding.wcagCriterionId &&
          assessment.status === 'failed'
      );
    });

    if (findingsWithoutMatchingCriteria.length > 0) {
      console.log(
        `Found ${findingsWithoutMatchingCriteria.length} findings without matching failed criteria:\n`
      );
      for (const finding of findingsWithoutMatchingCriteria) {
        const assessment = project.criterionAssessments.find(
          (a) => a.wcagCriterionId === finding.wcagCriterionId
        );
        console.log(`Finding: ${finding.code} - ${finding.title}`);
        console.log(`  WCAG: ${finding.wcagCriterion?.code} - ${finding.wcagCriterion?.titleNl}`);
        console.log(`  Current assessment status: ${assessment?.status || 'NOT FOUND'}`);
        console.log(`  Finding status: ${finding.status}`);
        console.log();
      }
    } else {
      console.log('All findings have matching failed criteria. ✓\n');
    }

    console.log('\n--- Failed criteria without findings ---\n');
    const failedWithoutFindings = project.criterionAssessments.filter((assessment) => {
      if (assessment.status !== 'failed') return false;
      return !project.findings.some(
        (f) => f.wcagCriterionId === assessment.wcagCriterionId
      );
    });

    if (failedWithoutFindings.length > 0) {
      console.log(
        `Found ${failedWithoutFindings.length} failed criteria without findings:\n`
      );
      for (const assessment of failedWithoutFindings) {
        console.log(
          `${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`
        );
        console.log(`  Status: ${assessment.status}\n`);
      }
    } else {
      console.log('All failed criteria have findings. ✓\n');
    }
  }

  await prisma.$disconnect();
}

checkWierdenCriteria().catch((error) => {
  console.error('Error checking Wierden criteria:', error);
  process.exit(1);
});