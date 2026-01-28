import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAuditedByOrg() {
  try {
    console.log('Updating all projects to set auditedByOrg to "Shift2"...');

    const result = await prisma.project.updateMany({
      where: {
        auditedByOrg: {
          not: 'Shift2'
        }
      },
      data: {
        auditedByOrg: 'Shift2'
      }
    });

    console.log(`✅ Successfully updated ${result.count} project(s)`);

    // Show all projects with their auditedByOrg
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        auditedByOrg: true
      }
    });

    console.log('\nAll projects:');
    allProjects.forEach(project => {
      console.log(`- ${project.title}: ${project.auditedByOrg}`);
    });

  } catch (error) {
    console.error('Error updating projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAuditedByOrg();