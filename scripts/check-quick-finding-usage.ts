import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if any findings reference quick findings
  const findingsWithQuickFinding = await prisma.finding.findMany({
    where: {
      quickFindingId: {
        not: null
      }
    },
    include: {
      quickFinding: true
    }
  });

  console.log('=== Findings that reference QuickFindings ===');
  console.log(`Found ${findingsWithQuickFinding.length} findings with quickFindingId`);

  if (findingsWithQuickFinding.length > 0) {
    console.log('\nDetails:');
    findingsWithQuickFinding.forEach((finding) => {
      console.log(`- Finding ID: ${finding.id}`);
      console.log(`  QuickFinding: ${finding.quickFinding?.title || 'NOT FOUND'}`);
      console.log(`  FindingCode: ${finding.findingCode}`);
    });
  }

  // Check all findings to see data we have
  const allFindings = await prisma.finding.count();
  console.log(`\n=== Total findings in database: ${allFindings} ===`);

  // Check all projects
  const allProjects = await prisma.project.count();
  console.log(`=== Total projects in database: ${allProjects} ===`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });