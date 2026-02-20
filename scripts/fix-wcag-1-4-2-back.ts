import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Resetting 1.4.2 to "Geluidsbediening"...\n');

  const criterion142 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.2' }
  });

  console.log('Current: 1.4.2:', criterion142?.titleNl);

  if (criterion142) {
    await prisma.wCAGCriterion.update({
      where: { id: criterion142.id },
      data: {
        titleNl: 'Geluidsbediening',
      }
    });
    console.log('✅ Updated 1.4.2 to "Geluidsbediening"');
  }

  const updated = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.2' }
  });

  console.log('Verification: 1.4.2:', updated?.titleNl);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });