import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking all indexes on projects table...');

    const indexes = await prisma.$queryRaw`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'projects'
      ORDER BY indexname;
    `;

    console.log('Indexes found:');
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\nChecking for unique constraints...');
    const constraints = await prisma.$queryRaw`
      SELECT
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'projects'::regclass
      ORDER BY conname;
    `;

    console.log('Constraints found:');
    console.log(JSON.stringify(constraints, null, 2));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();