import { prisma } from '../lib/prisma';

async function inspectFindings() {
  const projectId = 'dfc078cf-a6b5-4c92-b72e-15d5d1089804';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      findings: {
        include: {
          wcagCriterion: true,
          occurrences: {
            include: {
              sampleItem: true,
            },
          },
        },
      },
      criterionAssessments: {
        where: { status: 'failed' },
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log(`Project: ${project.title}\n`);
  console.log(`Total findings: ${project.findings.length}\n`);

  // Show failed criteria
  console.log('=== FAILED CRITERIA ===\n');
  project.criterionAssessments.forEach(assessment => {
    console.log(`${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);

    // Find findings for this criterion
    const findingsForCriterion = project.findings.filter(
      f => f.wcagCriterionId === assessment.wcagCriterionId
    );

    console.log(`  Findings: ${findingsForCriterion.length}`);

    findingsForCriterion.forEach((finding, i) => {
      console.log(`\n  Finding ${i + 1}: ${finding.findingCode}`);
      const issuePreview = finding.issue ? finding.issue.substring(0, 100) : 'No issue text';
      console.log(`    Issue: ${issuePreview}...`);
      console.log(`    Impact: ${finding.impact}`);
      console.log(`    Responsibility: ${finding.responsibility || 'N/A'}`);
      console.log(`    Occurrences: ${finding.occurrences.length}`);
      finding.occurrences.forEach(occ => {
        console.log(`      - ${occ.sampleItem?.title || 'Unknown'}`);
      });
    });

    console.log('');
  });

  await prisma.$disconnect();
}

inspectFindings();