import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUrkProject() {
  // Find the Urk project
  const urkProject = await prisma.project.findFirst({
    where: {
      kenmerk: 'Urk-01',
    },
  });

  if (!urkProject) {
    console.log('❌ Urk project not found');
    return;
  }

  console.log('\n=== Before Update ===');
  console.log(`Project: ${urkProject.title}`);
  console.log(`  auditedByOrg: "${urkProject.auditedByOrg}"`);
  console.log(`  commissionedBy: "${urkProject.commissionedBy}"`);
  console.log(`  clientProjectId: ${urkProject.clientProjectId || 'NULL'}`);

  // Find the client project for mijn.urk.nl
  const clientProject = await prisma.clientProject.findFirst({
    where: {
      name: 'mijn.urk.nl',
    },
    include: {
      opdrachtgever: true,
    },
  });

  if (!clientProject) {
    console.log('❌ Client project "mijn.urk.nl" not found');
    return;
  }

  console.log('\n=== Updating Project ===');
  console.log(`Setting auditedByOrg to: "${clientProject.opdrachtgever.naam}"`);
  console.log(`Setting clientProjectId to: ${clientProject.id}`);

  // Update the project
  const updatedProject = await prisma.project.update({
    where: {
      id: urkProject.id,
    },
    data: {
      auditedByOrg: clientProject.opdrachtgever.naam,
      clientProjectId: clientProject.id,
    },
  });

  console.log('\n=== After Update ===');
  console.log(`Project: ${updatedProject.title}`);
  console.log(`  auditedByOrg: "${updatedProject.auditedByOrg}"`);
  console.log(`  commissionedBy: "${updatedProject.commissionedBy}"`);
  console.log(`  clientProjectId: ${updatedProject.clientProjectId}`);
  console.log('\n✅ Urk project updated successfully!');
}

fixUrkProject()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });