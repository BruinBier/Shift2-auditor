import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKenmerken() {
  console.log('Starting kenmerk fix...');

  // Get all opdrachtgevers
  const opdrachtgevers = await prisma.opdrachtgever.findMany();

  for (const opdrachtgever of opdrachtgevers) {
    console.log(`\nProcessing opdrachtgever: ${opdrachtgever.naam} (${opdrachtgever.kenmerk})`);

    // Get all clientProjects for this opdrachtgever
    const clientProjects = await prisma.clientProject.findMany({
      where: { opdrachtgeverId: opdrachtgever.id },
      select: { id: true },
    });

    const clientProjectIds = clientProjects.map(cp => cp.id);

    // Find ALL projects for this opdrachtgever
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { clientProjectId: { in: clientProjectIds } },
          { commissionedBy: opdrachtgever.naam },
        ],
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
      select: { id: true, title: true, createdAt: true, kenmerk: true },
    });

    console.log(`Found ${projects.length} projects`);

    // Re-assign kenmerken in order
    let number = 1;
    for (const project of projects) {
      const newKenmerk = `${opdrachtgever.kenmerk}-${String(number).padStart(2, '0')}`;

      if (project.kenmerk !== newKenmerk) {
        await prisma.project.update({
          where: { id: project.id },
          data: { kenmerk: newKenmerk },
        });
        console.log(`  Updated: "${project.title}" from ${project.kenmerk} to ${newKenmerk}`);
      } else {
        console.log(`  OK: "${project.title}" already has ${newKenmerk}`);
      }

      number++;
    }
  }

  console.log('\nDone!');
}

fixKenmerken()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });