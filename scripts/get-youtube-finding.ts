import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getYouTubeFinding() {
  try {
    const finding = await prisma.quickFinding.findFirst({
      where: {
        title: {
          contains: 'YouTube'
        }
      }
    });

    if (finding) {
      console.log('Title:', finding.title);
      console.log('Criterion:', finding.criterionCode);
      console.log('\nDescription:');
      console.log(finding.description);
      console.log('\nAdvice:');
      console.log(finding.advice);
    } else {
      console.log('YouTube finding not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getYouTubeFinding();