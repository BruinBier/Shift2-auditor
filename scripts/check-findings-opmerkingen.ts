import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFindingsOpmerkingen() {
  try {
    const project = await prisma.project.findUnique({
      where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
      include: {
        findings: {
          include: {
            wcagCriterion: true,
            occurrences: {
              include: {
                sampleItem: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project) {
      console.log('Project not found');
      return;
    }

    console.log('Project:', project.title);
    console.log('Total findings:', project.findings.length);
    console.log('');

    const openFindings = project.findings.filter((f: any) => f.status === 'open');
    const otherFindings = project.findings.filter((f: any) => f.status !== 'open');

    console.log('Findings with status "open" (Afgekeurd):', openFindings.length);
    console.log('Findings with other status (Opmerkingen):', otherFindings.length);
    console.log('');

    if (otherFindings.length > 0) {
      console.log('=== OPMERKINGEN (status !== open) ===');
      otherFindings.forEach((f: any) => {
        console.log(`- ${f.code}: ${f.title}`);
        console.log(`  Status: ${f.status}`);
        console.log(`  Criterion: ${f.wcagCriterion.code} ${f.wcagCriterion.titleNl}`);
        console.log(`  Occurrences: ${f.occurrences.length}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFindingsOpmerkingen();
