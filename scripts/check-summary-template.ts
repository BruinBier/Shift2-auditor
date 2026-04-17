import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSummaryTemplate() {
  try {
    // Check formulieren research types
    const researchTypes = await prisma.researchType.findMany({
      where: {
        name: {
          contains: 'formulieren',
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        type: true,
        summaryTemplate: true,
      },
    });

    console.log(`Found ${researchTypes.length} formulieren research type(s)\n`);

    for (const rt of researchTypes) {
      console.log('--- Research Type:', rt.name, '---');
      console.log('Type:', rt.type);
      console.log('\nSummary Template:');
      console.log(rt.summaryTemplate);
      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSummaryTemplate();
