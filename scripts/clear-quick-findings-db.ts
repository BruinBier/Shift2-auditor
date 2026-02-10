import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearQuickFindings() {
  try {
    const result = await prisma.quickFinding.deleteMany({});
    console.log(`✅ Verwijderd: ${result.count} quick findings uit de database`);
    console.log('📝 De quick findings komen nu alleen uit lib/quick-findings-data.ts');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearQuickFindings();
