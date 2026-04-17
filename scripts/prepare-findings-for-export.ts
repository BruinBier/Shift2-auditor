import { prisma } from '../lib/prisma';

async function prepareFindings() {
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
        orderBy: {
          sortOrder: 'asc',
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

  console.log('=== BEVINDINGEN DATA VOOR WORD EXPORT ===\n');

  // Group findings by failed criteria
  project.criterionAssessments.forEach(assessment => {
    const criterion = assessment.wcagCriterion;
    const findingsForCriterion = project.findings.filter(
      f => f.wcagCriterionId === criterion.id
    );

    if (findingsForCriterion.length > 0) {
      console.log(`\n${criterion.code} ${criterion.titleNl} ${criterion.level}`);
      console.log(`Omschrijving: ${criterion.descriptionNl?.substring(0, 100)}...`);
      console.log(`\nAantal bevindingen: ${findingsForCriterion.length}`);

      findingsForCriterion.forEach((finding, i) => {
        console.log(`\n  --- Bevinding ${i + 1}: ${finding.findingCode} ---`);
        console.log(`  Beschrijving: ${finding.description?.substring(0, 150)}...`);
        console.log(`  Advies: ${finding.advice?.substring(0, 150)}...`);
        console.log(`  Impact: ${finding.impact}`);
        console.log(`  Verantwoordelijkheid: ${finding.responsibility || 'N/A'}`);
        console.log(`  Locaties (${finding.occurrences.length}):`);
        finding.occurrences.forEach(occ => {
          console.log(`    - ${occ.sampleItem?.title || 'Unknown'}`);
          if (occ.sampleItem?.url) {
            console.log(`      ${occ.sampleItem.url}`);
          }
        });
      });

      console.log('\n' + '='.repeat(80));
    }
  });

  await prisma.$disconnect();
}

prepareFindings();