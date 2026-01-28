import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = '0f8b21e6-6b1b-4ef7-bbec-70e79731fe13';

  console.log(`Removing unknown criteria for project ${projectId}...`);

  const result = await prisma.criterionAssessment.deleteMany({
    where: {
      projectId: projectId,
      status: 'unknown',
    },
  });

  console.log(`Removed ${result.count} unknown criterion assessments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });