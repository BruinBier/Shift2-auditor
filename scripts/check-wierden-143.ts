import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWierden143() {
  console.log('Checking 1.4.3 status for Wierden project...\n');

  // Find Wierden project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { title: { contains: 'Wierden' } },
        { subject: { contains: 'Wierden' } }
      ]
    },
    include: {
      criterionAssessments: {
        where: {
          wcagCriterion: {
            code: '1.4.3'
          }
        },
        include: {
          wcagCriterion: true
        }
      },
      findings: {
        where: {
          wcagCriterion: {
            code: '1.4.3'
          }
        }
      }
    }
  });

  if (!project) {
    console.log('❌ Wierden project not found');
    return;
  }

  console.log(`Project: ${project.title || project.subject}`);

  const assessment = project.criterionAssessments[0];

  if (!assessment) {
    console.log('❌ No assessment found for 1.4.3');
    return;
  }

  console.log(`\nCriterion: ${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);
  console.log(`Status: ${assessment.status}`);
  console.log(`Findings: ${project.findings.length}`);

  if (project.findings.length > 0) {
    console.log('\nFindings:');
    project.findings.forEach((finding) => {
      console.log(`  - ${finding.title}`);
    });
  }

  const expectedInTemplate = assessment.status === 'failed' ? 'Voldoet niet (bold)' : 'Voldoet (not bold)';
  console.log(`\nExpected in template: ${expectedInTemplate}`);
}

checkWierden143()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });