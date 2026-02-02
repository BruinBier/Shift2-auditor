import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const types = await prisma.researchType.findMany({
    orderBy: { name: 'asc' },
    include: {
      criteria: {
        select: {
          wcagCriterionId: true,
        },
      },
    },
  });
  
  const transformed = types.map(type => ({
    name: type.name,
    selectedCriteria: type.criteria.map(c => c.wcagCriterionId),
  }));
  
  console.log('API would return:');
  for (const t of transformed) {
    console.log(t.name + ':', t.selectedCriteria.length, 'criteria');
    if (t.selectedCriteria.length > 0) {
      console.log('  First 2 IDs:', t.selectedCriteria.slice(0, 2));
    }
  }
  
  await prisma.$disconnect();
}
test();
