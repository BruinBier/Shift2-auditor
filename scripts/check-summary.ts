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

  console.log('=== PROJECT INFO ===');
  console.log('Title:', project.title);
  console.log('Subject:', project.subject);
  console.log('Research Type:', project.researchType);
  console.log('Total Sample Items:', project.sampleItems.length);

  console.log('\n=== CRITERION ASSESSMENTS ===');
  console.log('Total Assessments:', project.criterionAssessments.length);

  const passed = project.criterionAssessments.filter(a => a.status === 'passed').length;
  const failed = project.criterionAssessments.filter(a => a.status === 'failed').length;
  const notPresent = project.criterionAssessments.filter(a => a.status === 'not_present').length;
  const unknown = project.criterionAssessments.filter(a => a.status === 'unknown').length;
  const notTested = project.criterionAssessments.filter(a => a.status === 'not_tested').length;

  console.log('Passed:', passed);
  console.log('Failed:', failed);
  console.log('Not Present:', notPresent);
  console.log('Unknown:', unknown);
  console.log('Not Tested:', notTested);

  const totalAssessed = passed + failed + notPresent + unknown;
  const effectivePassed = passed + notPresent;
  const percentage = totalAssessed > 0 ? Math.round((effectivePassed / totalAssessed) * 100) : 0;

  console.log('\nTotal Assessed (excl not_tested):', totalAssessed);
  console.log('Effective Passed (passed + not_present):', effectivePassed);
  console.log('Percentage:', percentage + '%');

  // Check if research type has criteria filter
  if (project.researchType) {
    const researchType = await prisma.researchType.findUnique({
      where: { name: project.researchType },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true
          }
        }
      }
    });

    if (researchType) {
      console.log('\n=== RESEARCH TYPE ===');
      console.log('Name:', researchType.name);
      console.log('Criteria in Research Type:', researchType.criteria.length);
      console.log('Has Summary Template:', !!researchType.summaryTemplate);

      if (researchType.criteria.length > 0) {
        // Filter assessments by research type criteria
        const allowedCriteriaIds = new Set(researchType.criteria.map(c => c.wcagCriterionId));
        const filteredAssessments = project.criterionAssessments.filter(
          assessment => allowedCriteriaIds.has(assessment.wcagCriterion.id)
        );

        console.log('\n=== FILTERED ASSESSMENTS (by research type) ===');
        console.log('Total Filtered:', filteredAssessments.length);

        const fPassed = filteredAssessments.filter(a => a.status === 'passed').length;
        const fFailed = filteredAssessments.filter(a => a.status === 'failed').length;
        const fNotPresent = filteredAssessments.filter(a => a.status === 'not_present').length;
        const fUnknown = filteredAssessments.filter(a => a.status === 'unknown').length;

        console.log('Passed:', fPassed);
        console.log('Failed:', fFailed);
        console.log('Not Present:', fNotPresent);
        console.log('Unknown:', fUnknown);

        const fTotalAssessed = fPassed + fFailed + fNotPresent + fUnknown;
        const fEffectivePassed = fPassed + fNotPresent;
        const fPercentage = fTotalAssessed > 0 ? Math.round((fEffectivePassed / fTotalAssessed) * 100) : 0;

        console.log('\nFiltered Total Assessed:', fTotalAssessed);
        console.log('Filtered Effective Passed:', fEffectivePassed);
        console.log('Filtered Percentage:', fPercentage + '%');
      }

      if (researchType.summaryTemplate) {
        console.log('\n=== SUMMARY TEMPLATE ===');
        console.log(researchType.summaryTemplate);
      }
    }
  }

  console.log('\n=== EXPECTED SUMMARY VALUES ===');
  console.log('totalPages:', project.sampleItems.length);
  console.log('totalCriteria:', totalAssessed);
  console.log('passedCriteria:', effectivePassed);
  console.log('percentage:', percentage);
  console.log('failedCriteria:', failed);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());