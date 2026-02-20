import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging criteria structure for project...\n');

  const projectId = '6b40737b-a874-4e09-8b16-d4de37a18487';

  // Get criteria 1.4.2 and 1.4.11
  const criterion142 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.2' }
  });

  const criterion1411 = await prisma.wCAGCriterion.findFirst({
    where: { code: '1.4.11' }
  });

  console.log('Database criteria:');
  console.log('1.4.2:', {
    id: criterion142?.id,
    code: criterion142?.code,
    titleNl: criterion142?.titleNl,
    principle: criterion142?.principle,
    guidelineCode: criterion142?.guidelineCode,
  });
  console.log('1.4.11:', {
    id: criterion1411?.id,
    code: criterion1411?.code,
    titleNl: criterion1411?.titleNl,
    principle: criterion1411?.principle,
    guidelineCode: criterion1411?.guidelineCode,
  });

  // Get assessments for this project
  const assessments = await prisma.criterionAssessment.findMany({
    where: {
      projectId,
      OR: [
        { wcagCriterionId: criterion142?.id },
        { wcagCriterionId: criterion1411?.id },
      ],
    },
    include: {
      wcagCriterion: true,
    },
  });

  console.log('\nAssessments:');
  assessments.forEach(a => {
    console.log(`- ${a.wcagCriterion.code} (${a.wcagCriterion.titleNl}): ${a.status}`);
  });

  // Get findings
  const findings = await prisma.finding.findMany({
    where: {
      projectId,
      OR: [
        { wcagCriterionId: criterion142?.id },
        { wcagCriterionId: criterion1411?.id },
      ],
    },
    include: {
      wcagCriterion: true,
    },
  });

  console.log('\nFindings:');
  findings.forEach(f => {
    console.log(`- ${f.findingCode}: Linked to ${f.wcagCriterion.code} (${f.wcagCriterion.titleNl})`);
  });

  // Check if there's a guideline issue
  console.log('\n1.4.2 guideline code:', criterion142?.guidelineCode);
  console.log('1.4.11 guideline code:', criterion1411?.guidelineCode);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });