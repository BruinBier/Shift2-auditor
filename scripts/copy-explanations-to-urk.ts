import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function copyExplanations() {
  try {
    // Find the mijn.hhnk.nl project by ID
    const hhnkProject = await prisma.project.findUnique({
      where: {
        id: '0f8b21e6-6b1b-4ef7-bbec-70e79731fe13'
      },
      include: {
        criterionAssessments: {
          where: {
            explanation: {
              not: null
            }
          },
          include: {
            wcagCriterion: true
          }
        }
      }
    });

    if (!hhnkProject) {
      console.log('mijn.hhnk.nl project niet gevonden');
      return;
    }

    console.log(`Gevonden project: ${hhnkProject.subject}`);
    console.log(`Onderzoekstype: ${hhnkProject.researchType}`);
    console.log(`Aantal toelichtingen: ${hhnkProject.criterionAssessments.length}`);

    // Find the mijn.urk.nl project by ID
    const urkProject = await prisma.project.findUnique({
      where: {
        id: '56a7ffd4-12ad-4972-ad3e-59d9250e0fba'
      }
    });

    if (!urkProject) {
      console.log('mijn.urk.nl project niet gevonden');
      return;
    }

    console.log(`\nDoel project: ${urkProject.subject}`);
    console.log(`Onderzoekstype: ${urkProject.researchType}`);

    // Check if both projects have the same research type
    if (hhnkProject.researchType !== urkProject.researchType) {
      console.log('\nWaarschuwing: Projecten hebben verschillende onderzoekstypes!');
      console.log(`HHNK: ${hhnkProject.researchType}`);
      console.log(`URK: ${urkProject.researchType}`);
    }

    // Copy explanations
    let copiedCount = 0;
    let updatedCount = 0;

    for (const assessment of hhnkProject.criterionAssessments) {
      if (!assessment.explanation) continue;

      // Check if assessment already exists for URK project
      const existingAssessment = await prisma.criterionAssessment.findFirst({
        where: {
          projectId: urkProject.id,
          wcagCriterionId: assessment.wcagCriterionId
        }
      });

      if (existingAssessment) {
        // Update existing assessment
        await prisma.criterionAssessment.update({
          where: {
            id: existingAssessment.id
          },
          data: {
            explanation: assessment.explanation
          }
        });
        console.log(`✓ Bijgewerkt: ${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);
        updatedCount++;
      } else {
        // Create new assessment
        await prisma.criterionAssessment.create({
          data: {
            projectId: urkProject.id,
            wcagCriterionId: assessment.wcagCriterionId,
            status: assessment.status,
            explanation: assessment.explanation
          }
        });
        console.log(`✓ Gekopieerd: ${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);
        copiedCount++;
      }
    }

    console.log(`\n✓ Klaar! ${copiedCount} nieuwe toelichtingen gekopieerd, ${updatedCount} bijgewerkt.`);
  } catch (error) {
    console.error('Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

copyExplanations();