import { prisma } from '../lib/prisma';

async function checkFindings() {
  const projectId = '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee';

  console.log('Checking findings for project...\n');

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      findings: {
        include: {
          wcagCriterion: true,
        },
      },
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (!project) {
    console.log('❌ Project not found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`Project: ${project.subject}`);
  console.log(`Total findings: ${project.findings.length}\n`);

  // Show ALL findings
  console.log('=== ALL FINDINGS ===');
  project.findings.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.wcagCriterion.code} - ${f.wcagCriterion.titleNl}`);
    console.log(`     Status: ${f.status}`);
    console.log(`     Code: ${f.findingCode}`);
    console.log(`     ID: ${f.id}`);
    console.log('');
  });

  // Find the 1.4.3 criterion
  const criterion143 = project.criterionAssessments.find(
    a => a.wcagCriterion.code === '1.4.3'
  );

  if (criterion143) {
    console.log(`\n=== Criterion 1.4.3 (${criterion143.wcagCriterion.titleNl}) ===`);
    console.log(`Assessment status: ${criterion143.status}\n`);

    // Find findings for this criterion
    const findingsFor143 = project.findings.filter(
      f => f.wcagCriterionId === criterion143.wcagCriterion.id
    );

    console.log(`Number of findings for 1.4.3: ${findingsFor143.length}\n`);

    if (findingsFor143.length > 0) {
      console.log('Findings:');
      findingsFor143.forEach((f, i) => {
        console.log(`  ${i + 1}. ID: ${f.id}`);
        console.log(`     Status: ${f.status}`);
        console.log(`     Code: ${f.findingCode}`);
        console.log(`     Description: ${f.description?.substring(0, 100)}...`);
        console.log('');
      });
    }
  } else {
    console.log('\n❌ Criterion 1.4.3 not found in assessments');
  }

  // Also show all non-open findings (these go to "Opmerkingen" in Word doc)
  const nonOpenFindings = project.findings.filter(f => f.status !== 'open');
  console.log(`\n=== All non-open findings (will appear in "Opmerkingen" section) ===`);
  console.log(`Total: ${nonOpenFindings.length}\n`);

  if (nonOpenFindings.length > 0) {
    nonOpenFindings.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.wcagCriterion.code} - ${f.wcagCriterion.titleNl}`);
      console.log(`     Status: ${f.status}`);
      console.log(`     Finding code: ${f.findingCode}`);
      console.log(`     ID: ${f.id}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkFindings();
