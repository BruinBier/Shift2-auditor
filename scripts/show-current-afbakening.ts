import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showCurrentAfbakening() {
  try {
    // Find all research types with "deelonderzoek content" in the name
    const researchTypes = await prisma.researchType.findMany({
      where: {
        name: {
          contains: 'deelonderzoek',
        },
      },
    });

    console.log(`Found ${researchTypes.length} research types with "deelonderzoek" in the name:\n`);

    for (const rt of researchTypes) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Research Type: ${rt.name}`);
      console.log(`ID: ${rt.id}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      if (rt.reportIntro) {
        console.log(`\nReport Intro (first 1000 characters):`);
        console.log(rt.reportIntro.substring(0, 1000));
        console.log(`\n... (total length: ${rt.reportIntro.length} characters)`);
      } else {
        console.log('\nNo reportIntro set for this research type');
      }

      console.log('\n');
    }
  } catch (error) {
    console.error('Error fetching research types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showCurrentAfbakening();