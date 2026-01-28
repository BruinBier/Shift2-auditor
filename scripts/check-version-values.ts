import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVersionValues() {
  const projects = await prisma.project.findMany({
    select: {
      kenmerk: true,
      title: true,
      version: true,
    },
    orderBy: { kenmerk: 'asc' },
  });

  console.log('\n=== Version Values in Database ===\n');

  for (const project of projects) {
    console.log(`${project.kenmerk || 'NO-KENMERK'}: ${project.title}`);
    console.log(`  Version: ${project.version} (type: ${typeof project.version})`);
    console.log('');
  }
}

checkVersionValues()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });