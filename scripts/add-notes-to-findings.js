const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Add notes column to findings table
    await prisma.$executeRaw`
      ALTER TABLE findings ADD COLUMN IF NOT EXISTS notes TEXT;
    `;

    console.log('✓ Successfully added notes column to findings table');
  } catch (error) {
    console.error('Error adding notes column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();