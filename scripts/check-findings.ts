import { prisma } from '../lib/prisma';

async function checkFindings() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Checking findings for project...\n');

  const findings = await prisma.finding.findMany({
    where: { projectId },
    include: {
      wcagCriterion: true,
      quickFinding: true,
      affectedUrls: {
        include: {
          scopeUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total findings: ${findings.length}\n`);

  if (findings.length === 0) {
    console.log('❌ No findings found!');
    console.log('\nPossible reasons:');
    console.log('  1. The auto-create API was not called successfully');
    console.log('  2. There was an error during finding creation');
    console.log('  3. The "Add to Sample" button was not clicked yet');
  } else {
    console.log('✅ Findings found:\n');
    findings.forEach((f, i) => {
      console.log(`${i + 1}. ${f.findingCode}: ${f.description.substring(0, 60)}...`);
      console.log(`   WCAG: ${f.wcagCriterion.code} - ${f.wcagCriterion.titleNl}`);
      console.log(`   Status: ${f.status}`);
      console.log(`   Impact: ${f.impact}`);
      console.log(`   Affected URLs: ${f.affectedUrls.length}`);
      if (f.affectedUrls.length > 0) {
        f.affectedUrls.forEach(au => {
          console.log(`     - ${au.scopeUrl.title || au.scopeUrl.url}`);
        });
      }
      console.log(`   Created: ${f.createdAt}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkFindings();
