import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking WCAG criteria 1.4.2 and 1.4.11...\n');

  // Find the criteria
  const criterion142 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.2' }
  });

  const criterion1411 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.11' }
  });

  console.log('Current state:');
  console.log('1.4.2:', criterion142?.titleNl);
  console.log('1.4.11:', criterion1411?.titleNl);
  console.log('');

  // Fix 1.4.2
  if (criterion142) {
    console.log('Updating 1.4.2...');
    await prisma.wCAGCriterion.update({
      where: { id: criterion142.id },
      data: {
        titleNl: 'Gebruiker heeft controle over audio die automatisch start',
      }
    });
    console.log('✅ Updated 1.4.2');
  }

  // 1.4.11 is already correct, no need to update
  console.log('1.4.11 is already correct - no update needed');

  console.log('\n✅ Done!');

  // Verify
  const updated142 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.2' }
  });

  const updated1411 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.11' }
  });

  console.log('\nVerification:');
  console.log('1.4.2:', updated142?.titleNl);
  console.log('1.4.11:', updated1411?.titleNl);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });