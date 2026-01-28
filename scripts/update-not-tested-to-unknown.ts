import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating criterion assessments from not_tested to unknown...');

  const result = await prisma.criterionAssessment.updateMany({
    where: {
      status: 'not_tested',
    },
    data: {
      status: 'unknown',
    },
  });

  console.log(`Updated ${result.count} criterion assessments from not_tested to unknown`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });