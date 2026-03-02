import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeTerToelichtingBold() {
  try {
    const researchType = await prisma.researchType.findFirst({
      where: {
        name: 'WCAG 2.2 AA deelonderzoek content',
      },
    });

    if (!researchType) {
      console.log('Research type not found');
      return;
    }

    console.log(`Found research type: ${researchType.name}`);

    const currentReportIntro = researchType.reportIntro || '';

    // Replace "Ter toelichting:" with bold version
    const updatedReportIntro = currentReportIntro.replace(
      'Ter toelichting:',
      '**Ter toelichting:**'
    );

    if (currentReportIntro === updatedReportIntro) {
      console.log('❌ "Ter toelichting:" not found or already bold');
      return;
    }

    // Update the database
    await prisma.researchType.update({
      where: { id: researchType.id },
      data: {
        reportIntro: updatedReportIntro,
      },
    });

    console.log('✅ "Ter toelichting:" is now bold!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeTerToelichtingBold();