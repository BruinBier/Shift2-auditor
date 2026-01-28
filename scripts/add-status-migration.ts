import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding status column to quick_findings table...');

    await prisma.$executeRaw`
      ALTER TABLE quick_findings
      ADD COLUMN IF NOT EXISTS status "FindingStatus"
    `;

    console.log('✅ Migration successful! Status column added to quick_findings table.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();