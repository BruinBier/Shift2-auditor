import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      criterionAssessments: {
        include: { wcagCriterion: true }
      },
      sampleItems: true
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('=== UNFILTERED ASSESSMENTS (what might show if no filter) ===');
  let unfilteredStats = {
    passed: project.criterionAssessments.filter(a => a.status === 'passed').length,
    failed: project.criterionAssessments.filter(a => a.status === 'failed').length,
    notPresent: project.criterionAssessments.filter(a => a.status === 'not_present').length,
    unknown: project.criterionAssessments.filter(a => a.status === 'unknown').length,
    notTested: project.criterionAssessments.filter(a => a.status === 'not_tested').length,
  };

  let unfilteredTotal = unfilteredStats.passed + unfilteredStats.failed + unfilteredStats.notPresent + unfilteredStats.unknown;
  let unfilteredEffective = unfilteredStats.passed + unfilteredStats.notPresent;

  console.log('Total:', unfilteredTotal);
  console.log('Passed:', unfilteredStats.passed);
  console.log('Failed:', unfilteredStats.failed);
  console.log('Not Present:', unfilteredStats.notPresent);
  console.log('Effective Passed:', unfilteredEffective);
  console.log('Percentage:', unfilteredTotal > 0 ? Math.round((unfilteredEffective / unfilteredTotal) * 100) : 0, '%');

  // Now filter by research type
  const researchType = await prisma.researchType.findUnique({
    where: { name: project.researchType! },
    include: {
      criteria: {
        select: {
          wcagCriterionId: true,
        },
      },
    },
  });

  if (researchType && researchType.criteria.length > 0) {
    const allowedCriteriaIds = new Set(researchType.criteria.map(c => c.wcagCriterionId));
    const filteredAssessments = project.criterionAssessments.filter(
      assessment => allowedCriteriaIds.has(assessment.wcagCriterion.id)
    );

    console.log('\n=== FILTERED ASSESSMENTS (what SHOULD show) ===');
    let filteredStats = {
      passed: filteredAssessments.filter(a => a.status === 'passed').length,
      failed: filteredAssessments.filter(a => a.status === 'failed').length,
      notPresent: filteredAssessments.filter(a => a.status === 'not_present').length,
      unknown: filteredAssessments.filter(a => a.status === 'unknown').length,
      notTested: filteredAssessments.filter(a => a.status === 'not_tested').length,
    };

    let filteredTotal = filteredStats.passed + filteredStats.failed + filteredStats.notPresent + filteredStats.unknown;
    let filteredEffective = filteredStats.passed + filteredStats.notPresent;

    console.log('Total:', filteredTotal);
    console.log('Passed:', filteredStats.passed);
    console.log('Failed:', filteredStats.failed);
    console.log('Not Present:', filteredStats.notPresent);
    console.log('Effective Passed:', filteredEffective);
    console.log('Percentage:', filteredTotal > 0 ? Math.round((filteredEffective / filteredTotal) * 100) : 0, '%');
  }

  // Check what could give us 27
  console.log('\n=== WHERE DOES 27 COME FROM? ===');
  console.log('33 (total) - 6 = 27 (if 6 were excluded somehow)');
  console.log('30 (filtered) - 3 = 27 (if 3 were excluded somehow)');

  // Maybe it's counting only passed + failed?
  const passedPlusFailed = unfilteredStats.passed + unfilteredStats.failed;
  console.log('Passed + Failed (unfiltered):', passedPlusFailed);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());