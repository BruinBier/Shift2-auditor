import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { kenmerk: { startsWith: 'Urk-' } },
        { commissionedBy: { contains: 'Urk' } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      kenmerk: true,
      title: true,
      createdAt: true,
    },
  });

  console.log('\nUrk projects (ordered by createdAt):');
  projects.forEach((p, index) => {
    console.log(`${index + 1}. ${p.kenmerk}: "${p.title}"`);
    console.log(`   Created: ${p.createdAt.toISOString()}`);
    console.log(`   ID: ${p.id}\n`);
  });
}

checkProjects()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });