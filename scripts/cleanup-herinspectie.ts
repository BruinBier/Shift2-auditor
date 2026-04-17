import { prisma } from '../lib/prisma';

async function cleanupHerinspectie() {
  const herinspectieId = 'b160cb88-c117-43c1-ac24-66c9da3f77b8';

  console.log(`🧹 Starting cleanup of herinspectie project: ${herinspectieId}`);

  try {
    // Delete finding occurrences
    console.log('Deleting finding occurrences...');
    const deletedOccurrences = await prisma.findingOccurrence.deleteMany({
      where: {
        finding: {
          projectId: herinspectieId,
        },
      },
    });
    console.log(`✓ Deleted ${deletedOccurrences.count} finding occurrences`);

    // Delete finding URLs
    console.log('Deleting finding URLs...');
    const deletedFindingUrls = await prisma.findingUrl.deleteMany({
      where: {
        finding: {
          projectId: herinspectieId,
        },
      },
    });
    console.log(`✓ Deleted ${deletedFindingUrls.count} finding URLs`);

    // Delete finding attachments
    console.log('Deleting finding attachments...');
    const deletedAttachments = await prisma.findingAttachment.deleteMany({
      where: {
        finding: {
          projectId: herinspectieId,
        },
      },
    });
    console.log(`✓ Deleted ${deletedAttachments.count} finding attachments`);

    // Delete findings
    console.log('Deleting findings...');
    const deletedFindings = await prisma.finding.deleteMany({
      where: { projectId: herinspectieId },
    });
    console.log(`✓ Deleted ${deletedFindings.count} findings`);

    // Delete crawler results
    console.log('Deleting crawler results...');
    const deletedCrawlerResults = await prisma.crawlerResult.deleteMany({
      where: {
        OR: [
          {
            scopeUrl: {
              projectId: herinspectieId,
            },
          },
          {
            sampleItem: {
              projectId: herinspectieId,
            },
          },
        ],
      },
    });
    console.log(`✓ Deleted ${deletedCrawlerResults.count} crawler results`);

    // Delete sample items
    console.log('Deleting sample items...');
    const deletedSampleItems = await prisma.sampleItem.deleteMany({
      where: { projectId: herinspectieId },
    });
    console.log(`✓ Deleted ${deletedSampleItems.count} sample items`);

    // Delete scope URLs
    console.log('Deleting scope URLs...');
    const deletedScopeUrls = await prisma.projectScopeUrl.deleteMany({
      where: { projectId: herinspectieId },
    });
    console.log(`✓ Deleted ${deletedScopeUrls.count} scope URLs`);

    // Delete criterion assessments
    console.log('Deleting criterion assessments...');
    const deletedAssessments = await prisma.criterionAssessment.deleteMany({
      where: { projectId: herinspectieId },
    });
    console.log(`✓ Deleted ${deletedAssessments.count} criterion assessments`);

    console.log('\n✅ Cleanup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set the nulmeting status back to "In uitvoering" in the UI');
    console.log('2. Click "Onderzoek afronden" to re-finalize');
    console.log('3. This will copy all data cleanly to the herinspectie');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupHerinspectie()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });