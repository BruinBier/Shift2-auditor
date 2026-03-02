import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Dropping unique index on kenmerk field...');

    // Drop the unique index if it exists
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS projects_kenmerk_key;
    `);

    console.log('✓ Unique index dropped successfully');

    // Verify by checking remaining indexes
    console.log('\nVerifying: checking remaining indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'projects' AND indexname LIKE '%kenmerk%';
    `;

    console.log('Kenmerk indexes found:', indexes);

    if (Array.isArray(indexes) && indexes.length === 0) {
      console.log('✓ All kenmerk indexes removed successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();