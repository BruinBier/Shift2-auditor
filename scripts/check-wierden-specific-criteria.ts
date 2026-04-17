import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificCriteria() {
  console.log('Checking criteria 1.1.1 and 1.3.1 for Wierden project...\n');

  // Find the Wierden project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { title: { contains: 'Wierden', mode: 'insensitive' } },
        { subject: { contains: 'Wierden', mode: 'insensitive' } },
      ],
    },
    include: {
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
      findings: {
        where: {
          OR: [{ status: 'published' }, { status: 'open' }],
        },
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (!project) {
    console.error('Project not found!');
    process.exit(1);
  }

  console.log(`Found project: ${project.title}\n`);

  // Check criteria 1.1.1 and 1.3.1
  const criteriaCodes = ['1.1.1', '1.3.1'];

  for (const code of criteriaCodes) {
    const assessment = project.criterionAssessments.find(
      (a) => a.wcagCriterion.code === code
    );

    if (!assessment) {
      console.log(`❌ Criterion ${code} not found in assessments!`);
      continue;
    }

    const findings = project.findings.filter(
      (f) => f.wcagCriterionId === assessment.wcagCriterion.id
    );

    console.log(`Criterion: ${assessment.wcagCriterion.code} - ${assessment.wcagCriterion.titleNl}`);
    console.log(`  Level: ${assessment.wcagCriterion.level}`);
    console.log(`  Database status: ${assessment.status}`);
    console.log(`  Findings count: ${findings.length}`);

    if (findings.length > 0) {
      console.log(`  Findings:`);
      findings.forEach((f) => {
        console.log(`    - ${f.code}: ${f.title} (${f.status})`);
      });
    }

    console.log();
  }

  await prisma.$disconnect();
}

checkSpecificCriteria().catch((error) => {
  console.error('Error checking criteria:', error);
  process.exit(1);
});