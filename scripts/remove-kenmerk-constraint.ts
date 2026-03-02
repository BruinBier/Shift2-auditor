import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking and removing unique constraint on kenmerk field...');

    // Drop the unique constraint if it exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_kenmerk_key";
    `);

    console.log('✓ Unique constraint removed successfully');

    // Verify by checking if we can create projects with the same kenmerk
    console.log('Verifying: checking existing constraints...');
    const result = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'projects' AND constraint_name LIKE '%kenmerk%';
    `;

    console.log('Kenmerk constraints found:', result);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();