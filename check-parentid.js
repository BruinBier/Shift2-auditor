const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkParentIds() {
  console.log('\n=== Checking parentProjectId for Ijsselstein and Bel-4 ===\n');

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { contains: 'Ijsselstein' } },
        { title: { contains: 'Bel-4' } }
      ]
    },
    select: {
      id: true,
      title: true,
      parentProjectId: true
    }
  });

  console.log('Projects gevonden:', projects.length);
  console.log('');

  projects.forEach(p => {
    console.log(`Project: ${p.title}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  parentProjectId: ${p.parentProjectId || 'NULL'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkParentIds().catch(e => {
  console.error(e);
  process.exit(1);
});