import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateReportIntroHeader() {
  console.log('Updating reportIntroHeader for deelonderzoek content...\n');

  // Update voor "WCAG 2.2 AA deelonderzoek content"
  const updated = await prisma.researchType.update({
    where: {
      name: 'WCAG 2.2 AA deelonderzoek content',
    },
    data: {
      reportIntroHeader: 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content op de website {url}',
    },
  });

  console.log('✅ Updated research type:');
  console.log(`   Name: ${updated.name}`);
  console.log(`   reportIntroHeader: ${updated.reportIntroHeader}`);

  await prisma.$disconnect();
}

updateReportIntroHeader()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });