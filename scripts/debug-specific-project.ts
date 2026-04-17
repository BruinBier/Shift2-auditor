import { prisma } from '../lib/prisma';

async function debugProject() {
  const projectId = 'dfc078cf-a6b5-4c92-b72e-15d5d1089804';
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      criterionAssessments: {
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log(`Project: ${project.title}\n`);

  const principleLabels: Record<string, string> = {
    'Perceivable': 'Waarneembaar',
    'Operable': 'Bedienbaar',
    'Understandable': 'Begrijpelijk',
    'Robust': 'Robuust',
  };

  ['Perceivable', 'Operable', 'Understandable', 'Robust'].forEach(principle => {
    console.log(`\n=== ${principleLabels[principle]} (${principle}) ===`);

    const criteriaForPrinciple = project.criterionAssessments.filter(
      (a: any) => a.wcagCriterion.principle === principle
    );

    const levelA = criteriaForPrinciple.filter((a: any) => a.wcagCriterion.level === 'A');
    const levelAA = criteriaForPrinciple.filter((a: any) => a.wcagCriterion.level === 'AA');

    console.log(`\nNiveau A (${levelA.length} criteria):`);
    levelA.forEach((a: any) => {
      console.log(`  ${a.wcagCriterion.code}: ${a.status}`);
    });

    const levelAApproved = levelA.filter((a: any) => a.status === 'passed' || a.status === 'not_present').length;
    const levelATested = levelA.filter((a: any) => a.status !== 'not_tested').length;
    console.log(`  -> Goedgekeurd: ${levelAApproved} / Getoetst: ${levelATested}`);

    console.log(`\nNiveau AA (${levelAA.length} criteria):`);
    levelAA.forEach((a: any) => {
      console.log(`  ${a.wcagCriterion.code}: ${a.status}`);
    });

    const levelAAApproved = levelAA.filter((a: any) => a.status === 'passed' || a.status === 'not_present').length;
    const levelAATested = levelAA.filter((a: any) => a.status !== 'not_tested').length;
    console.log(`  -> Goedgekeurd: ${levelAAApproved} / Getoetst: ${levelAATested}`);

    const totalApproved = levelAApproved + levelAAApproved;
    const totalTested = levelATested + levelAATested;
    console.log(`\nTotaal: ${totalApproved} / ${totalTested}`);
  });

  // Calculate overall totals
  console.log('\n\n=== TOTAAL ===');

  const allLevelA = project.criterionAssessments.filter((a: any) => a.wcagCriterion.level === 'A');
  const allLevelAA = project.criterionAssessments.filter((a: any) => a.wcagCriterion.level === 'AA');

  const totalLevelAApproved = allLevelA.filter((a: any) => a.status === 'passed' || a.status === 'not_present').length;
  const totalLevelATested = allLevelA.filter((a: any) => a.status !== 'not_tested').length;

  const totalLevelAAApproved = allLevelAA.filter((a: any) => a.status === 'passed' || a.status === 'not_present').length;
  const totalLevelAATested = allLevelAA.filter((a: any) => a.status !== 'not_tested').length;

  const grandTotalApproved = totalLevelAApproved + totalLevelAAApproved;
  const grandTotalTested = totalLevelATested + totalLevelAATested;

  console.log(`Niveau A: ${totalLevelAApproved} / ${totalLevelATested}`);
  console.log(`Niveau AA: ${totalLevelAAApproved} / ${totalLevelAATested}`);
  console.log(`Totaal: ${grandTotalApproved} / ${grandTotalTested}`);

  await prisma.$disconnect();
}

debugProject();
