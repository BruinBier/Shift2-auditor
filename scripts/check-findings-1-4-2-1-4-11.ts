import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking findings for criteria 1.4.2 and 1.4.11...\n');

  // Get the criteria IDs
  const criterion142 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.2' }
  });

  const criterion1411 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.11' }
  });

  if (!criterion142 || !criterion1411) {
    console.log('❌ Could not find criteria');
    return;
  }

  console.log('Criterion 1.4.2:', criterion142.titleNl);
  console.log('Criterion 1.4.11:', criterion1411.titleNl);
  console.log('');

  // Find findings for project
  const findings142 = await prisma.finding.findMany({
    where: {
      wcagCriterionId: criterion142.id,
      projectId: '6b40737b-a874-4e09-8b16-d4de37a18487'
    },
    select: {
      id: true,
      findingCode: true,
      description: true,
    }
  });

  const findings1411 = await prisma.finding.findMany({
    where: {
      wcagCriterionId: criterion1411.id,
      projectId: '6b40737b-a874-4e09-8b16-d4de37a18487'
    },
    select: {
      id: true,
      findingCode: true,
      description: true,
    }
  });

  console.log(`\nFindings for 1.4.2 (${findings142.length}):`);
  findings142.forEach(f => {
    console.log(`  - ${f.findingCode}: ${f.description.substring(0, 80)}...`);
  });

  console.log(`\nFindings for 1.4.11 (${findings1411.length}):`);
  findings1411.forEach(f => {
    console.log(`  - ${f.findingCode}: ${f.description.substring(0, 80)}...`);
  });

  // Check if any findings for 1.4.2 mention "contrast" which would indicate they should be 1.4.11
  const contrastFindings = findings142.filter(f =>
    f.description.toLowerCase().includes('contrast')
  );

  if (contrastFindings.length > 0) {
    console.log(`\n⚠️  Found ${contrastFindings.length} findings for 1.4.2 that mention "contrast":`);
    contrastFindings.forEach(f => {
      console.log(`  - ${f.findingCode}`);
    });

    console.log('\nThese findings should probably be linked to 1.4.11 instead.');
    console.log('\nDo you want to move them to 1.4.11? (yes/no)');

    // For now, just list them - manual confirmation needed
    console.log('\n💡 To fix manually, update these findings in the admin interface.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });