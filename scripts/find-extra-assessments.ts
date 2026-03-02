import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      criterionAssessments: {
        include: { wcagCriterion: true }
      }
    }
  });

  if (!project || !project.researchType) {
    console.log('Project or research type not found');
    return;
  }

  const researchType = await prisma.researchType.findUnique({
    where: { name: project.researchType },
    include: {
      criteria: {
        include: {
          wcagCriterion: true
        }
      }
    }
  });

  if (!researchType) {
    console.log('Research type not found');
    return;
  }

  const allowedCriteriaIds = new Set(researchType.criteria.map(c => c.wcagCriterionId));

  console.log('=== EXTRA ASSESSMENTS (not in research type) ===');
  const extraAssessments = project.criterionAssessments.filter(
    assessment => !allowedCriteriaIds.has(assessment.wcagCriterion.id)
  );

  if (extraAssessments.length === 0) {
    console.log('No extra assessments found');
  } else {
    extraAssessments.forEach(assessment => {
      console.log(`${assessment.wcagCriterion.code} ${assessment.wcagCriterion.titleNl} - ${assessment.status}`);
    });
  }

  console.log('\n=== MISSING ASSESSMENTS (in research type but not assessed) ===');
  const assessedCriteriaIds = new Set(project.criterionAssessments.map(a => a.wcagCriterion.id));
  const missingCriteria = researchType.criteria.filter(
    c => !assessedCriteriaIds.has(c.wcagCriterionId)
  );

  if (missingCriteria.length === 0) {
    console.log('All criteria from research type are assessed');
  } else {
    for (const criterion of missingCriteria) {
      const wcagCriterion = await prisma.wCAGCriterion.findUnique({
        where: { id: criterion.wcagCriterionId }
      });
      if (wcagCriterion) {
        console.log(`${wcagCriterion.code} ${wcagCriterion.titleNl}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());