import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const findings = await prisma.finding.findMany({
    where: {
      projectId: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804',
      wcagCriterion: {
        code: '1.3.5'
      }
    },
    include: {
      wcagCriterion: true
    },
    orderBy: {
      sortOrder: 'asc'
    }
  });

  console.log('Found', findings.length, 'findings for 1.3.5\n');
  findings.forEach((f, i) => {
    console.log(`\n========== Finding ${i + 1} ==========`);
    console.log('Code:', f.findingCode);
    console.log('Status:', f.status);
    console.log('\nDescription (first 800 chars):');
    console.log(f.description.substring(0, 800));
    console.log('\n...');
  });

  await prisma.$disconnect();
}

main().catch(console.error);