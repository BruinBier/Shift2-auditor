import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    select: {
      managementSummary: true,
      researcherFeedback: true,
      researchType: true
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  const researchTypeData = await prisma.researchType.findUnique({
    where: { name: project.researchType }
  });

  console.log('Debug Info:');
  console.log('===========');
  console.log('managementSummary:', project.managementSummary === null ? 'null' : project.managementSummary === '' ? 'empty string' : 'has value (' + project.managementSummary?.length + ' chars)');
  console.log('researcherFeedback:', project.researcherFeedback ? 'has value (' + project.researcherFeedback.length + ' chars)' : 'null/empty');
  console.log('researchTypeData:', researchTypeData ? 'found' : 'not found');
  console.log('summaryTemplate:', researchTypeData?.summaryTemplate ? 'has value (' + researchTypeData.summaryTemplate.length + ' chars)' : 'null/empty');

  console.log('\nPath taken in DOCX generation:');
  if (project.managementSummary) {
    console.log('  -> Using managementSummary (researcher feedback will NOT be added automatically)');
  } else if (researchTypeData?.summaryTemplate) {
    console.log('  -> Using research type template (researcher feedback WILL be added)');
  } else {
    console.log('  -> Using fallback');
  }
}

main().then(() => process.exit(0));