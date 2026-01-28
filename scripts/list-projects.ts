import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProjects() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        subject: true,
        title: true,
        researchType: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log('Gevonden projecten:\n');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.subject || project.title}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Onderzoekstype: ${project.researchType}`);
      console.log('');
    });
  } catch (error) {
    console.error('Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listProjects();