import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllQuickFindings() {
  console.log('Starting to delete all quick findings...\n');

  try {
    // Get count before deletion
    const count = await prisma.quickFinding.count();
    console.log(`Found ${count} quick findings in the database\n`);

    if (count === 0) {
      console.log('No quick findings to delete.');
      return;
    }

    // Delete all quick findings
    const result = await prisma.quickFinding.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} quick finding(s)`);
  } catch (error) {
    console.error('Error deleting quick findings:', error);
    throw error;
  }
}

deleteAllQuickFindings()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });