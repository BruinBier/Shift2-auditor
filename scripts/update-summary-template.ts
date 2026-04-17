import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSummaryTemplate() {
  try {
    console.log('Updating summary template for formulieren research type...\n');

    const newTemplate = '<p class="mb-3">Dit onderzoek is door Shift2 uitgevoerd tussen {dateStart} en {dateEnd}. Voor dit deelonderzoek is een representatieve steekproef samengesteld uit {uniqueForms} {formsSingularPlural} met in het totaal {totalPages} {pagesSingularPlural} met verschillende kenmerken en complexiteitsniveaus.</p><p class="mb-3">De onderzochte content voldoet {compliesFully} aan WCAG 2.2 niveau A en AA.</p><p class="mb-3">In dit deelonderzoek zijn {totalCriteria} succescriteria beoordeeld. Er wordt voldaan aan {passedCriteria} van deze {totalCriteria} succescriteria ({percentage}%). Bij {failedCriteria} {criteriaFailedSingularPlural} zijn afwijkingen vastgesteld.</p>';

    const result = await prisma.researchType.updateMany({
      where: {
        name: {
          contains: 'formulieren',
          mode: 'insensitive',
        },
      },
      data: {
        summaryTemplate: newTemplate,
      },
    });

    console.log(`✅ Successfully updated ${result.count} research type(s)`);

    // Show the updated template
    const updated = await prisma.researchType.findFirst({
      where: {
        name: {
          contains: 'formulieren',
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        summaryTemplate: true,
      },
    });

    if (updated) {
      console.log('\nUpdated template:');
      console.log(updated.summaryTemplate);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSummaryTemplate();
