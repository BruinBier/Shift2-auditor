import { prisma } from '../lib/prisma';

async function checkCorrectProject() {
  const correctProjectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Checking findings for the CORRECT project...\n');

  const findings = await prisma.finding.findMany({
    where: { projectId: correctProjectId },
    include: {
      affectedUrls: {
        include: {
          scopeUrl: true,
        },
      },
      quickFinding: true,
    },
    orderBy: { findingCode: 'asc' },
  });

  console.log(`Total findings: ${findings.length}\n`);

  findings.forEach((f) => {
    console.log(`Finding: ${f.findingCode}`);
    console.log(`  QuickFinding: ${f.quickFinding?.title || 'NULL'}`);
    console.log(`  Status: ${f.status}`);
    console.log(`  Impact: ${f.impact}`);
    console.log(`  AffectedUrls: ${f.affectedUrls.length}`);
    f.affectedUrls.forEach((au) => {
      console.log(`    - ${au.scopeUrl.url}`);
    });
    console.log(`  Description (first 100 chars): ${f.description.substring(0, 100)}...`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkCorrectProject();
