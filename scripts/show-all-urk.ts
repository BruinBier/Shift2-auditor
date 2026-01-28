import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showAll() {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { kenmerk: { startsWith: 'Urk-' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      kenmerk: true,
      title: true,
      createdAt: true,
    },
  });

  console.log('\n=== ALL URK PROJECTS (ordered by createdAt DESC) ===\n');
  projects.forEach((p, index) => {
    console.log(`Row ${index + 1}:`);
    console.log(`  Kenmerk: ${p.kenmerk}`);
    console.log(`  Title: ${p.title}`);
    console.log(`  Created: ${p.createdAt.toISOString()}`);
    console.log(`  ID: ${p.id}\n`);
  });
}

showAll()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });