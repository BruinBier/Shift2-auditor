import { prisma } from '../lib/prisma';

async function checkOpdrachtgever() {
  const project = await prisma.project.findUnique({
    where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    include: {
      clientProject: {
        include: {
          opdrachtgever: true,
        },
      },
    },
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('=== Opdrachtgever Data ===');
  console.log('project.commissionedBy:', project.commissionedBy);
  console.log('project.clientProject:', project.clientProject ? 'EXISTS' : 'NULL');

  if (project.clientProject) {
    console.log('project.clientProject.opdrachtgever:', project.clientProject.opdrachtgever ? 'EXISTS' : 'NULL');

    if (project.clientProject.opdrachtgever) {
      console.log('project.clientProject.opdrachtgever.naam:', project.clientProject.opdrachtgever.naam);
    }
  }

  // Test the regex replacement
  const naam = project.clientProject?.opdrachtgever?.naam || project.commissionedBy || '';
  console.log('\n=== Processing ===');
  console.log('Original naam:', naam);
  console.log('After replace:', naam.replace(/^gemeente\s+/i, ''));

  // Test with exact string
  console.log('\nTest "gemeente Wierden":', 'gemeente Wierden'.replace(/^gemeente\s+/i, ''));
  console.log('Test "Gemeente Wierden":', 'Gemeente Wierden'.replace(/^gemeente\s+/i, ''));
}

checkOpdrachtgever()
  .then(() => {
    console.log('\nDone');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });