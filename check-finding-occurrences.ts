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
      wcagCriterion: true,
      occurrences: {
        include: {
          sampleItem: true
        }
      }
    },
    orderBy: {
      sortOrder: 'asc'
    }
  });

  console.log('Found', findings.length, 'findings for 1.3.5\n');

  const finding2 = findings[1]; // Second finding (index 1)
  if (finding2) {
    console.log(`========== Finding 2: ${finding2.findingCode} ==========`);
    console.log('Status:', finding2.status);
    console.log('Occurrences:', finding2.occurrences.length);
    console.log('\nOccurrences:');
    finding2.occurrences.forEach((occ, i) => {
      console.log(`  ${i + 1}. ${occ.sampleItem?.title || 'No title'}`);
      console.log(`     URL: ${occ.sampleItem?.url || 'No URL'}`);
    });

    console.log('\n\nFull Description:');
    console.log(finding2.description);
  }

  await prisma.$disconnect();
}

main().catch(console.error);