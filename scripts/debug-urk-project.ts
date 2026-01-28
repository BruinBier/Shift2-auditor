import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUrkProject() {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { kenmerk: { startsWith: 'Urk-' } },
        { commissionedBy: { contains: 'Urk' } },
        { auditedByOrg: { contains: 'Urk' } },
      ],
    },
    include: {
      clientProject: {
        include: {
          opdrachtgever: true,
        },
      },
    },
  });

  console.log('\n=== Urk Projects Debug Info ===\n');

  for (const project of projects) {
    console.log(`Project: ${project.title}`);
    console.log(`  Kenmerk: ${project.kenmerk}`);
    console.log(`  ID: ${project.id}`);
    console.log(`  auditedByOrg: "${project.auditedByOrg}"`);
    console.log(`  commissionedBy: "${project.commissionedBy}"`);
    console.log(`  clientProjectId: ${project.clientProjectId || 'NULL'}`);

    if (project.clientProject) {
      console.log(`  ClientProject:`);
      console.log(`    ID: ${project.clientProject.id}`);
      console.log(`    Title: ${project.clientProject.title}`);
      console.log(`    Opdrachtgever: ${project.clientProject.opdrachtgever.naam}`);
      console.log(`    Opdrachtgever Kenmerk: ${project.clientProject.opdrachtgever.kenmerk}`);
    } else {
      console.log(`  ❌ NO CLIENT PROJECT LINKED`);
    }
    console.log('');
  }
}

checkUrkProject()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });