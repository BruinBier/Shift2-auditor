import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showFullContent() {
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Research Type: ${researchType.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nFULL REPORT INTRO:\n');
    console.log(researchType.reportIntro || 'No content');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total length: ${researchType.reportIntro?.length || 0} characters`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showFullContent();