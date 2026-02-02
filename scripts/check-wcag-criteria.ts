import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWcagCriteria() {
  try {
    const count = await prisma.wCAGCriterion.count();
    console.log(`\n📊 WCAG Criteria in database: ${count}`);

    if (count === 0) {
      console.log('\n❌ No WCAG criteria found!');
      console.log('💡 Run: npm run db:seed to populate WCAG criteria\n');
    } else {
      console.log('✅ WCAG criteria are present\n');

      // Show first 5 as sample
      const sample = await prisma.wCAGCriterion.findMany({
        take: 5,
        orderBy: { code: 'asc' }
      });

      console.log('Sample criteria:');
      sample.forEach(c => {
        console.log(`  - ${c.code}: ${c.titleNl}`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking WCAG criteria:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWcagCriteria();