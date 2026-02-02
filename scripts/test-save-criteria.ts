import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  // Get first research type
  const rt = await prisma.researchType.findFirst();
  console.log('Testing with:', rt.name);
  
  // Get first 5 WCAG criteria
  const criteria = await prisma.wCAGCriterion.findMany({ take: 5 });
  console.log('Adding', criteria.length, 'criteria');
  
  // Add them
  for (const c of criteria) {
    await prisma.researchTypeWCAGCriterion.create({
      data: {
        researchTypeId: rt.id,
        wcagCriterionId: c.id,
      },
    });
    console.log('  -', c.code);
  }
  
  // Verify
  const updated = await prisma.researchType.findUnique({
    where: { id: rt.id },
    include: { criteria: { include: { wcagCriterion: { select: { code: true } } } } }
  });
  
  console.log('\nResult:', updated.criteria.length, 'criteria saved');
  console.log('IDs:', updated.criteria.map(c => c.wcagCriterionId).slice(0, 3));
  
  await prisma.$disconnect();
}
test();
