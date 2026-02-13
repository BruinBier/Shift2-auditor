import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPagineringFinding() {
  try {
    const finding = await prisma.quickFinding.findFirst({
      where: {
        title: {
          contains: 'Paginering'
        }
      }
    });

    if (finding) {
      console.log('ID:', finding.id);
      console.log('Title:', finding.title);
      console.log('Criterion:', finding.criterionCode);
      console.log('\nDescription:');
      console.log(finding.description);
      console.log('\nAdvice:');
      console.log(finding.advice);
    } else {
      console.log('Paginering finding not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getPagineringFinding();