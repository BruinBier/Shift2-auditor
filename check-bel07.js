const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProject() {
  try {
    const project = await prisma.project.findFirst({
      where: {
        kenmerk: 'BEL-07',
        version: 1.0
      }
    });

    if (project) {
      console.log('BEL-07 v1.0 gevonden:');
      console.log('- ID:', project.id);
      console.log('- Title:', project.title);
      console.log('- ResearchType:', project.researchType);
      console.log('- IsExternalProject:', project.isExternalProject);
      console.log('- HasReinspection:', project.hasReinspection);
    } else {
      console.log('BEL-07 v1.0 niet gevonden');
    }
  } catch (error) {
    console.error('Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProject();