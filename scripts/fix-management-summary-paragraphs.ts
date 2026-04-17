import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixManagementSummaryParagraphs() {
  try {
    console.log('Fixing managementSummary paragraphs in all projects...\n');

    // Fetch all projects with managementSummary
    const projects = await prisma.project.findMany({
      where: {
        managementSummary: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        managementSummary: true,
        researchType: true,
      },
    });

    console.log(`Found ${projects.length} project(s) with managementSummary\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
      const summary = project.managementSummary!;

      // Pattern 1: For "formulieren" projects
      // Match: </p><p>De onderzochte formuliercontent voldoet ... aan WCAG 2.2 niveau A en AA. In dit deelonderzoek
      const formulierenPattern = /(<\/p><p>De onderzochte formuliercontent voldoet (?:volledig|niet volledig) aan WCAG 2\.2 niveau A en AA\.) (In dit deelonderzoek zijn)/i;

      // Pattern 2: For regular projects
      // Match: </p><p>De onderzochte content voldoet ... aan WCAG 2.2 niveau A en AA. In dit deelonderzoek
      const regularPattern = /(<\/p><p>De onderzochte content voldoet (?:volledig|niet volledig) aan WCAG 2\.2 niveau A en AA\.) (In dit deelonderzoek zijn)/i;

      let updatedSummary = summary;
      let wasUpdated = false;

      // Check if it matches the pattern and needs updating
      if (formulierenPattern.test(summary)) {
        updatedSummary = summary.replace(formulierenPattern, '$1</p><p>$2');
        wasUpdated = true;
        console.log(`📝 Updating: ${project.title} (formulieren)`);
      } else if (regularPattern.test(summary)) {
        updatedSummary = summary.replace(regularPattern, '$1</p><p>$2');
        wasUpdated = true;
        console.log(`📝 Updating: ${project.title} (regular)`);
      } else {
        console.log(`⏭️  Skipping: ${project.title} (no match or already fixed)`);
        skippedCount++;
        continue;
      }

      if (wasUpdated) {
        // Update the project
        await prisma.project.update({
          where: { id: project.id },
          data: { managementSummary: updatedSummary },
        });
        updatedCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} project(s)`);
    console.log(`⏭️  Skipped ${skippedCount} project(s) (no changes needed)`);

  } catch (error) {
    console.error('❌ Error updating projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixManagementSummaryParagraphs();