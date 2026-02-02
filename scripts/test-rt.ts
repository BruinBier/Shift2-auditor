import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const count = await prisma.researchTypeWCAGCriterion.count();
  console.log('Total criteria relationships:', count);
  const types = await prisma.researchType.findMany({ include: { criteria: true } });
  for (const t of types) {
    console.log(t.name + ': ' + t.criteria.length + ' criteria');
  }
  await prisma.$disconnect();
}
check();
