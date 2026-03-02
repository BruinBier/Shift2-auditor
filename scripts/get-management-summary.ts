import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1' },
    select: {
      managementSummary: true,
      researchType: true
    }
  });

  console.log('Research Type:', project?.researchType);
  console.log('\nManagement Summary:');
  console.log(project?.managementSummary || 'NULL (auto-generated summary will be used)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());