const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running database migration...');

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE project_scope_urls ADD COLUMN IF NOT EXISTS title TEXT');
    console.log('✓ Added title column');

    await prisma.$executeRawUnsafe('ALTER TABLE project_scope_urls ADD COLUMN IF NOT EXISTS crawler_type TEXT');
    console.log('✓ Added crawler_type column');

    await prisma.$executeRawUnsafe('ALTER TABLE project_scope_urls ADD COLUMN IF NOT EXISTS in_scope BOOLEAN NOT NULL DEFAULT true');
    console.log('✓ Added in_scope column');

    await prisma.$executeRawUnsafe('ALTER TABLE projects ADD COLUMN IF NOT EXISTS scope_info TEXT');
    console.log('✓ Added scope_info column');

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
