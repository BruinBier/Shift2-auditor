import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Finding ijsselstein reinspection project...');

    // Find the reinspection project for ijsselstein
    const projects = await prisma.project.findMany({
      where: {
        title: {
          contains: 'ijsselstein',
          mode: 'insensitive'
        },
        version: 1.1
      },
      select: {
        id: true,
        title: true,
        version: true,
        dateStart: true,
        dateEnd: true,
      }
    });

    if (projects.length === 0) {
      console.log('No ijsselstein reinspection project found');
      return;
    }

    console.log(`Found ${projects.length} project(s):`);
    projects.forEach(p => {
      console.log(`- ${p.title} (v${p.version})`);
      console.log(`  Current: ${p.dateStart?.toISOString()} - ${p.dateEnd?.toISOString()}`);
    });

    // Fix each project
    for (const project of projects) {
      if (project.dateStart) {
        // Calculate new deadline: 1 week after start date
        const newDeadline = new Date(project.dateStart);
        newDeadline.setDate(newDeadline.getDate() + 7);

        console.log(`\nUpdating ${project.title}:`);
        console.log(`  New deadline: ${newDeadline.toISOString()}`);

        await prisma.project.update({
          where: { id: project.id },
          data: {
            dateEnd: newDeadline,
            reportDate: newDeadline,
          }
        });

        console.log('  ✓ Updated successfully');
      }
    }

    console.log('\n✓ All done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();