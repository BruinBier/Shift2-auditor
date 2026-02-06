import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const researchTypes = await prisma.researchType.findMany({
    orderBy: { name: 'asc' },
  });

  console.log(`\n📊 Aantal onderzoekstypen in database: ${researchTypes.length}\n`);

  researchTypes.forEach((rt, index) => {
    console.log(`${index + 1}. ${rt.name}`);
    console.log(`   - Versie: ${rt.version}`);
    console.log(`   - Level: ${rt.level}`);
    console.log(`   - Type: ${rt.type}\n`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });