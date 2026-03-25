import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    select: { researchType: true, level: true }
  });

  console.log('Project researchType:', project?.researchType);
  console.log('Project level:', project?.level);

  if (project?.researchType) {
    const researchType = await prisma.researchType.findUnique({
      where: { name: project.researchType },
      include: {
        criteria: {
          include: {
            wcagCriterion: true
          }
        }
      }
    });

    const has135 = researchType?.criteria.some(c => c.wcagCriterion.code === '1.3.5');
    console.log('\nResearchType includes 1.3.5:', has135);

    if (!has135) {
      console.log('\n❌ Criterium 1.3.5 is NIET onderdeel van dit onderzoekstype!');
      console.log('Totaal aantal criteria in onderzoekstype:', researchType?.criteria.length);

      // Show first few criteria codes
      console.log('\nEerste 10 criteria in dit onderzoekstype:');
      researchType?.criteria.slice(0, 10).forEach(c => {
        console.log('  -', c.wcagCriterion.code, c.wcagCriterion.titleNl);
      });
    } else {
      console.log('\n✅ Criterium 1.3.5 IS onderdeel van dit onderzoekstype!');
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);