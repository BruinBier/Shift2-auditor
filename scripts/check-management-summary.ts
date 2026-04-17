import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkManagementSummary() {
  try {
    const project = await prisma.project.findUnique({
      where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
      select: {
        title: true,
        managementSummary: true,
      },
    });

    if (!project) {
      console.log('Project not found');
      return;
    }

    console.log('Project:', project.title);
    console.log('\n--- Raw HTML ---');
    console.log(project.managementSummary);
    console.log('\n--- Formatted (with line breaks visible) ---');
    if (project.managementSummary) {
      // Show with visible line breaks
      console.log(project.managementSummary.replace(/\n/g, '\\n'));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagementSummary();