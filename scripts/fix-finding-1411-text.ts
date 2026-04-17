import { prisma } from '../lib/prisma';

async function fixFinding1411Text() {
  // Find the project
  const project = await prisma.project.findUnique({
    where: { id: '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee' },
    include: {
      findings: {
        include: {
          wcagCriterion: true
        }
      }
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  // Find the finding for criterion 1.4.11 with status !== 'open' (opmerking)
  const finding = project.findings.find(f =>
    f.wcagCriterion.code === '1.4.11' && f.status !== 'open'
  );

  if (!finding) {
    console.log('Finding not found for criterion 1.4.11 with status !== "open"');
    return;
  }

  console.log('Found finding:', finding.id);
  console.log('Current description:', finding.description);

  // Update the description
  const updatedDescription = finding.description?.replace(
    /Op de formulierenpagina's is een versie voor hoog contrast aanwezig/g,
    'Op de pagina\'s is een versie voor hoog contrast aanwezig'
  );

  if (updatedDescription && updatedDescription !== finding.description) {
    await prisma.finding.update({
      where: { id: finding.id },
      data: {
        description: updatedDescription
      }
    });

    console.log('\nUpdated description to:', updatedDescription);
  } else {
    console.log('No changes needed or pattern not found');
  }

  await prisma.$disconnect();
}

fixFinding1411Text().catch(console.error);