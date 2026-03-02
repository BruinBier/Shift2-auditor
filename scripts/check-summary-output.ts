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

  // Simulate the filtering that happens in page.tsx
  let filteredAssessments = project.criterionAssessments;
  if (project.researchType) {
    const researchType = await prisma.researchType.findUnique({
      where: { name: project.researchType },
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
      filteredAssessments = project.criterionAssessments.filter(
        assessment => allowedCriteriaIds.has(assessment.wcagCriterion.id)
      );
    }
  }

  // Calculate stats like in calculateReportStats
  const passed = filteredAssessments.filter(a => a.status === 'passed').length;
  const failed = filteredAssessments.filter(a => a.status === 'failed').length;
  const notPresent = filteredAssessments.filter(a => a.status === 'not_present').length;
  const unknown = filteredAssessments.filter(a => a.status === 'unknown').length;

  const totalAssessed = passed + failed + notPresent + unknown;
  const effectivePassed = passed + notPresent;
  const percentage = totalAssessed > 0 ? Math.round((effectivePassed / totalAssessed) * 100) : 0;

  console.log('=== WHAT THE SUMMARY SHOULD SHOW ===');
  console.log(`totalPages: ${project.sampleItems.length}`);
  console.log(`totalCriteria: ${totalAssessed}`);
  console.log(`passedCriteria: ${effectivePassed}`);
  console.log(`percentage: ${percentage}%`);
  console.log(`failedCriteria: ${failed}`);

  console.log('\n=== CURRENT SUMMARY TEXT (default template) ===');
  const dateStart = project.researchStartedOn || project.dateStart;
  const dateEnd = project.dateEnd;

  const dateStartFormatted = dateStart ? new Date(dateStart).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) : '[datum]';
  const dateEndFormatted = dateEnd ? new Date(dateEnd).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) : '[datum]';

  console.log(`Het onderzoek vond plaats in de periode van ${dateStartFormatted} tot en met ${dateEndFormatted}. Voor dit deelonderzoek is een representatieve steekproef samengesteld van ${project.sampleItems.length} gepubliceerde webpagina's met verschillende contenttypen.`);
  console.log('');
  console.log(`De onderzochte content voldoet ${percentage === 100 ? 'volledig' : 'niet volledig'} aan WCAG 2.2 niveau A en AA. In dit deelonderzoek zijn ${totalAssessed} succescriteria beoordeeld. Er wordt voldaan aan ${effectivePassed} van deze ${totalAssessed} succescriteria (${percentage}%). Bij ${failed} ${failed === 1 ? 'succescriterium' : 'succescriteria'} zijn afwijkingen vastgesteld.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());