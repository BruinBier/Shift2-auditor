import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUrkOpdrachtgever() {
  // Check opdrachtgevers
  const opdrachtgevers = await prisma.opdrachtgever.findMany({
    where: {
      OR: [
        { naam: { contains: 'Urk' } },
        { kenmerk: { contains: 'Urk' } },
      ],
    },
  });

  console.log('\n=== Urk Opdrachtgevers ===');
  if (opdrachtgevers.length === 0) {
    console.log('❌ No opdrachtgevers found for Urk');
  } else {
    opdrachtgevers.forEach((o) => {
      console.log(`\nOpdrachtgever: ${o.naam}`);
      console.log(`  ID: ${o.id}`);
      console.log(`  Kenmerk: ${o.kenmerk}`);
    });
  }

  // Check client projects
  const clientProjects = await prisma.clientProject.findMany({
    where: {
      OR: [
        { name: { contains: 'Urk' } },
        { opdrachtgever: { naam: { contains: 'Urk' } } },
      ],
    },
    include: {
      opdrachtgever: true,
    },
  });

  console.log('\n=== Urk Client Projects ===');
  if (clientProjects.length === 0) {
    console.log('❌ No client projects found for Urk');
  } else {
    clientProjects.forEach((cp) => {
      console.log(`\nClient Project: ${cp.name}`);
      console.log(`  ID: ${cp.id}`);
      console.log(`  Opdrachtgever: ${cp.opdrachtgever.naam}`);
    });
  }
}

checkUrkOpdrachtgever()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });