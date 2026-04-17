import { prisma } from '../lib/prisma';

async function updateIntroHeader() {
  await prisma.researchType.update({
    where: { name: 'WCAG 2.2 AA deelonderzoek content formulieren' },
    data: {
      reportIntroHeader: 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content van de formulieren op {url}.'
    }
  });

  console.log('Updated reportIntroHeader for formulieren research type');

  await prisma.$disconnect();
}

updateIntroHeader();