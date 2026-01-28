import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetKenmerken() {
  console.log('Resetting ALL kenmerken...');

  // First, reset all kenmerken to null
  await prisma.project.updateMany({
    data: { kenmerk: null },
  });

  console.log('All kenmerken reset to null');

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
      select: { id: true, title: true, createdAt: true },
    });

    console.log(`Found ${projects.length} projects`);

    // Assign kenmerken in order of creation date
    let number = 1;
    for (const project of projects) {
      const newKenmerk = `${opdrachtgever.kenmerk}-${String(number).padStart(2, '0')}`;

      await prisma.project.update({
        where: { id: project.id },
        data: { kenmerk: newKenmerk },
      });

      const dateStr = project.createdAt.toISOString().split('T')[0];
      console.log(`  ${newKenmerk}: "${project.title}" (created: ${dateStr})`);

      number++;
    }
  }

  console.log('\nDone!');
}

resetKenmerken()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });