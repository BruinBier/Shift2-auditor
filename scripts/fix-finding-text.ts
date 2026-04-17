import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'dfc078cf-a6b5-4c92-b72e-15d5d1089804';

  console.log('Finding bevinding for SC 1.4.3...');

  // First, find the WCAG criterion 1.4.3
  const criterion = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.3' }
  });

  if (!criterion) {
    console.log('WCAG Criterion 1.4.3 not found');
    return;
  }

  console.log(`Found criterion: ${criterion.code} ${criterion.titleNl}`);

  // Find findings for this criterion in this project
  const findings = await prisma.finding.findMany({
    where: {
      projectId: projectId,
      wcagCriterionId: criterion.id
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`\nFound ${findings.length} finding(s) for SC 1.4.3`);

  for (const finding of findings) {
    console.log(`\nFinding ID: ${finding.id}`);
    console.log(`Code: ${finding.code}`);
    console.log('Description preview:', finding.description?.substring(0, 200));

    if (finding.description?.includes('Op de formulierenpagina')) {
      console.log('\n✓ Found finding with "Op de formulierenpagina"');

      // Replace the text
      const updatedDescription = finding.description.replace(
        /Op de formulierenpagina's/g,
        'Op pagina\'s met formulieren'
      );

      console.log('\nUpdating description...');
      await prisma.finding.update({
        where: { id: finding.id },
        data: { description: updatedDescription }
      });

      console.log('✓ Updated successfully');
    }
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
