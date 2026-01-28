import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateStartDate() {
  try {
    console.log('Updating start dates to 12 januari 2026...');

    // Update all projects with dateStart = 2026-01-08 to 2026-01-12
    const result = await prisma.project.updateMany({
      where: {
        dateStart: new Date('2026-01-08')
      },
      data: {
        dateStart: new Date('2026-01-12'),
        researchStartedOn: new Date('2026-01-12')
      }
    });

    console.log(`✅ Successfully updated ${result.count} project(s)`);

    // Show all projects with their dates
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        dateStart: true,
        dateEnd: true,
        researchStartedOn: true
      }
    });

    console.log('\nAll projects:');
    allProjects.forEach(project => {
      console.log(`- ${project.title}`);
      console.log(`  Start: ${project.dateStart}`);
      console.log(`  End: ${project.dateEnd}`);
      console.log(`  Research started: ${project.researchStartedOn}`);
    });

  } catch (error) {
    console.error('Error updating projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStartDate();