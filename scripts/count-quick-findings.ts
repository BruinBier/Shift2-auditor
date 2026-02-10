import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countQuickFindings() {
  try {
    const count = await prisma.quickFinding.count();
    console.log(`📊 Total quick findings in database: ${count}`);

    if (count > 0) {
      const findings = await prisma.quickFinding.findMany({
        select: {
          id: true,
          title: true,
          criterionCode: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('\n📝 Quick findings:');
      findings.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.title} (${f.criterionCode})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countQuickFindings();