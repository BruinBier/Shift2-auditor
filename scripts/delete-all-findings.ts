import { prisma } from '../lib/prisma';

async function deleteAllFindings() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Deleting all findings for project...\n');

  // First delete all FindingUrls
  await prisma.findingUrl.deleteMany({
    where: {
      finding: {
        projectId,
      },
    },
  });
  console.log('✓ Deleted all FindingUrls');

  // Then delete all FindingOccurrences
  await prisma.findingOccurrence.deleteMany({
    where: {
      finding: {
        projectId,
      },
    },
  });
  console.log('✓ Deleted all FindingOccurrences');

  // Finally delete all Findings
  const result = await prisma.finding.deleteMany({
    where: { projectId },
  });

  console.log(`✓ Deleted ${result.count} findings\n`);

  await prisma.$disconnect();
}

deleteAllFindings();
