import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllSummaryTemplates() {
  try {
    const researchTypes = await prisma.researchType.findMany({
      where: {
        summaryTemplate: {
          not: null,
        },
      },
      select: {
        name: true,
        type: true,
        summaryTemplate: true,
      },
    });

    console.log(`Found ${researchTypes.length} research type(s) with summaryTemplate\n`);

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

checkAllSummaryTemplates();
