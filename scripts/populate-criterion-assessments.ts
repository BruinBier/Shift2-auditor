import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateCriterionAssessments() {
  console.log('Starting to populate criterion assessments...\n');

  // Get all projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      researchType: true,
      criterionAssessments: {
        select: {
          wcagCriterionId: true,
        },
      },
    },
  });

  console.log(`Found ${projects.length} projects\n`);

  for (const project of projects) {
    console.log(`\nProcessing project: "${project.title}"`);
    console.log(`  Research type: ${project.researchType}`);
    console.log(`  Existing assessments: ${project.criterionAssessments.length}`);

    if (!project.researchType) {
      console.log('  ⚠️  No research type specified, skipping...');
      continue;
    }

    // Get research type with criteria
    const researchType = await prisma.researchType.findFirst({
      where: { name: project.researchType },
      include: {
        criteria: {
          select: {
            wcagCriterionId: true,
          },
        },
      },
    });

    if (!researchType) {
      console.log(`  ⚠️  Research type "${project.researchType}" not found in database, skipping...`);
      continue;
    }

    if (researchType.criteria.length === 0) {
      console.log('  ⚠️  Research type has no criteria, skipping...');
      continue;
    }

    console.log(`  Research type has ${researchType.criteria.length} criteria`);

    // Get existing assessment criterion IDs
    const existingCriterionIds = new Set(
      project.criterionAssessments.map(ca => ca.wcagCriterionId)
    );

    // Get criterion IDs from research type
    const researchTypeCriterionIds = new Set(
      researchType.criteria.map(c => c.wcagCriterionId)
    );

    // Find criteria that need to be added (in research type but not in project)
    const criteriaToAdd = researchType.criteria.filter(
      c => !existingCriterionIds.has(c.wcagCriterionId)
    );

    // Find criteria that need to be removed (in project but not in research type)
    const criteriaToRemove = project.criterionAssessments.filter(
      ca => !researchTypeCriterionIds.has(ca.wcagCriterionId)
    );

    if (criteriaToAdd.length === 0 && criteriaToRemove.length === 0) {
      console.log('  ✅ All criteria are in sync, no action needed');
      continue;
    }

    if (criteriaToRemove.length > 0) {
      console.log(`  🗑️  Removing ${criteriaToRemove.length} criterion assessments...`);
      await prisma.criterionAssessment.deleteMany({
        where: {
          projectId: project.id,
          wcagCriterionId: {
            in: criteriaToRemove.map(ca => ca.wcagCriterionId),
          },
        },
      });
      console.log(`  ✅ Removed ${criteriaToRemove.length} assessments`);
    }

    if (criteriaToAdd.length > 0) {
      console.log(`  📝 Adding ${criteriaToAdd.length} new criterion assessments...`);

      // Create criterion assessments
      await prisma.criterionAssessment.createMany({
        data: criteriaToAdd.map(c => ({
          projectId: project.id,
          wcagCriterionId: c.wcagCriterionId,
          status: 'not_tested',
        })),
      });

      console.log(`  ✅ Successfully added ${criteriaToAdd.length} assessments`);
    }
  }

  console.log('\n✅ Done! All projects have been updated.');
}

populateCriterionAssessments()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });