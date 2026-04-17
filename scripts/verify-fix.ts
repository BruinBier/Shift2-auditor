import { prisma } from '../lib/prisma';

async function verify() {
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

  if (!project) return;

  const principleLabels: Record<string, string> = {
    'Perceivable': 'Waarneembaar',
    'Operable': 'Bedienbaar',
    'Understandable': 'Begrijpelijk',
    'Robust': 'Robuust',
  };

  console.log('NIEUWE BEREKENING (alleen passed = goedgekeurd):\n');

  ['Perceivable', 'Operable', 'Understandable', 'Robust'].forEach(principle => {
    const criteriaForPrinciple = project.criterionAssessments.filter(
      (a: any) => a.wcagCriterion.principle === principle
    );

    const levelA = criteriaForPrinciple.filter((a: any) => a.wcagCriterion.level === 'A');
    const levelAA = criteriaForPrinciple.filter((a: any) => a.wcagCriterion.level === 'AA');

    const countApproved = (arr: any[]) => arr.filter((a: any) => a.status === 'passed').length;
    const countTested = (arr: any[]) => arr.filter((a: any) => a.status !== 'not_tested').length;

    const levelAApproved = countApproved(levelA);
    const levelATested = countTested(levelA);
    const levelAAApproved = countApproved(levelAA);
    const levelAATested = countTested(levelAA);
    const totalApproved = levelAApproved + levelAAApproved;
    const totalTested = levelATested + levelAATested;

    console.log(`${principleLabels[principle]}: ${levelAApproved}/${levelATested}, ${levelAAApproved}/${levelAATested}, ${totalApproved}/${totalTested}`);
  });

  const allLevelA = project.criterionAssessments.filter((a: any) => a.wcagCriterion.level === 'A');
  const allLevelAA = project.criterionAssessments.filter((a: any) => a.wcagCriterion.level === 'AA');

  const totalLevelAApproved = allLevelA.filter((a: any) => a.status === 'passed').length;
  const totalLevelATested = allLevelA.filter((a: any) => a.status !== 'not_tested').length;

  const totalLevelAAApproved = allLevelAA.filter((a: any) => a.status === 'passed').length;
  const totalLevelAATested = allLevelAA.filter((a: any) => a.status !== 'not_tested').length;

  const grandTotalApproved = totalLevelAApproved + totalLevelAAApproved;
  const grandTotalTested = totalLevelATested + totalLevelAATested;

  console.log(`\nTotaal: ${totalLevelAApproved}/${totalLevelATested}, ${totalLevelAAApproved}/${totalLevelAATested}, ${grandTotalApproved}/${grandTotalTested}`);

  console.log('\n\nVERWACHT:');
  console.log('Waarneembaar: 5/9, 4/7, 9/16');
  console.log('Bedienbaar: 5/7, 1/2, 6/9');
  console.log('Begrijpelijk: 1/2, 2/2, 3/4');
  console.log('Robuust: 0/1, 0/0, 0/1');
  console.log('\nTotaal: 11/19, 7/11, 18/30');

  await prisma.$disconnect();
}

verify();
