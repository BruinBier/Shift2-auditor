import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const count = await prisma.researchTypeWCAGCriterion.count();
  console.log('Total criteria relationships:', count);
  console.log('');

  const types = await prisma.researchType.findMany({
    include: {
      criteria: {
        include: {
          wcagCriterion: true
        },
        orderBy: {
          wcagCriterion: {
            code: 'asc'
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  for (const t of types) {
    console.log('📋 ' + t.name);
    console.log('   Versie: ' + t.version + ' | Level: ' + t.level);
    console.log('   Aantal criteria: ' + t.criteria.length);

    if (t.criteria.length > 0) {
      console.log('   Eerste 5 criteria:');
      t.criteria.slice(0, 5).forEach((c, i) => {
        console.log('     ' + (i + 1) + '. ' + c.wcagCriterion.code + ' - ' + c.wcagCriterion.titleNl);
      });
      if (t.criteria.length > 5) {
        console.log('     ... en ' + (t.criteria.length - 5) + ' meer');
      }
    } else {
      console.log('   ⚠️  GEEN criteria gekoppeld!');
    }
    console.log('');
  }

  await prisma.$disconnect();
}
check();
