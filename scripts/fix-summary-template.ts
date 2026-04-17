import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing summary template to remove "binnen de Shift2-omgeving"...');

  // Find all research types with summaryTemplate containing the text
  const researchTypes = await prisma.researchType.findMany({
    where: {
      summaryTemplate: {
        contains: 'binnen de Shift2-omgeving'
      }
    }
  });

  console.log(`Found ${researchTypes.length} research type(s) with the text`);

  for (const researchType of researchTypes) {
    console.log(`\nProcessing: ${researchType.name}`);
    console.log('Old template:');
    console.log(researchType.summaryTemplate);

    // Remove "binnen de Shift2-omgeving" from the template
    const updatedTemplate = researchType.summaryTemplate?.replace(/binnen de Shift2-omgeving /g, '');

    console.log('\nNew template:');
    console.log(updatedTemplate);

    // Update the research type
    await prisma.researchType.update({
      where: { id: researchType.id },
      data: { summaryTemplate: updatedTemplate }
    });

    console.log('✓ Updated');
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });