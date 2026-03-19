const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listProjects() {
  console.log('\n=== Alle Projecten ===\n');

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      parentProjectId: true
    },
    orderBy: {
      title: 'asc'
    }
  });

  console.log(`Totaal aantal projecten: ${projects.length}\n`);

  projects.forEach(p => {
    console.log(`📋 ${p.title}`);
    console.log(`   ID: ${p.id.substring(0, 8)}...`);
    console.log(`   parentProjectId: ${p.parentProjectId ? p.parentProjectId.substring(0, 8) + '...' : 'NULL'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

listProjects().catch(e => {
  console.error(e);
  process.exit(1);
});