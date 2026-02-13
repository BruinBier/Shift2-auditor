import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPagineringFindings() {
  try {
    const findings = await prisma.quickFinding.findMany({
      where: {
        title: {
          contains: 'Paginering'
        }
      }
    });

    console.log(`Found ${findings.length} Paginering findings:\n`);

    for (const finding of findings) {
      console.log('ID:', finding.id);
      console.log('Title:', finding.title);
      console.log('Criterion:', finding.criterionCode);
      console.log('\nDescription:');
      console.log(finding.description);
      console.log('\nAdvice:');
      console.log(finding.advice);
      console.log('\n' + '='.repeat(80) + '\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getPagineringFindings();