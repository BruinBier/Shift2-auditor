import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = '60f79d7a-49a6-45ed-92ee-96ff9697f0b4';

  console.log('Testing update of quick finding:', id);

  try {
    const result = await prisma.quickFinding.update({
      where: { id },
      data: {
        description: 'TEST UPDATED DESCRIPTION',
        advice: 'TEST UPDATED ADVICE',
        impact: 'klein',
        responsibility: 'redacteur',
      }
    });

    console.log('Success! Updated quick finding:', result);
  } catch (error) {
    console.error('Error updating:', error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });