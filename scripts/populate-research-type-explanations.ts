import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateResearchTypeExplanations() {
  try {
    // Find the mijn.hhnk.nl project
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
    console.log(`Aantal toelichtingen: ${hhnkProject.criterionAssessments.length}\n`);

    // Copy explanations to research type defaults
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const assessment of hhnkProject.criterionAssessments) {
      if (!assessment.explanation) continue;

      try {
        // Check if explanation already exists for this research type and criterion
        const existing = await prisma.researchTypeExplanation.findFirst({
          where: {
            researchTypeName: hhnkProject.researchType,
            wcagCriterionId: assessment.wcagCriterionId
          }
        });

        if (existing) {
          // Update existing
          await prisma.researchTypeExplanation.update({
            where: {
              id: existing.id
            },
            data: {
              explanation: assessment.explanation
            }
          });
          console.log(`✓ Bijgewerkt: ${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);
          updatedCount++;
        } else {
          // Create new
          await prisma.researchTypeExplanation.create({
            data: {
              researchTypeName: hhnkProject.researchType,
              wcagCriterionId: assessment.wcagCriterionId,
              explanation: assessment.explanation
            }
          });
          console.log(`✓ Aangemaakt: ${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`✗ Fout bij ${assessment.wcagCriterion.code}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n✓ Klaar!`);
    console.log(`  ${createdCount} nieuwe standaard toelichtingen aangemaakt`);
    console.log(`  ${updatedCount} standaard toelichtingen bijgewerkt`);
    if (skippedCount > 0) {
      console.log(`  ${skippedCount} overgeslagen vanwege fouten`);
    }
  } catch (error) {
    console.error('Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateResearchTypeExplanations();