import { prisma } from '../lib/prisma';

async function updateSummaryTemplateText() {
  // First check current template
  const currentData = await prisma.researchType.findUnique({
    where: { name: 'WCAG 2.2 AA deelonderzoek content formulieren' },
    select: { summaryTemplate: true }
  });

  console.log('Current template:');
  console.log(currentData?.summaryTemplate);
  console.log('\n---\n');

  // Update the template - change "formuliercontent" to "content"
  await prisma.researchType.update({
    where: { name: 'WCAG 2.2 AA deelonderzoek content formulieren' },
    data: {
      summaryTemplate: '<p class="mb-3">Dit onderzoek is door Shift2 uitgevoerd tussen {dateStart} en {dateEnd}. Voor dit deelonderzoek is een representatieve steekproef samengesteld uit {uniqueForms} {formsSingularPlural} met in het totaal {totalPages} {pagesSingularPlural} binnen de Shift2-omgeving met verschillende kenmerken en complexiteitsniveaus.</p><p class="mb-3">De onderzochte content voldoet {compliesFully} aan WCAG 2.2 niveau A en AA. In dit deelonderzoek zijn {totalCriteria} succescriteria beoordeeld. Er wordt voldaan aan {passedCriteria} van deze {totalCriteria} succescriteria ({percentage}%). Bij {failedCriteria} {criteriaFailedSingularPlural} zijn afwijkingen vastgesteld.</p>'
    }
  });

  console.log('Updated summary template - changed "formuliercontent" to "content"');

  await prisma.$disconnect();
}

updateSummaryTemplateText();