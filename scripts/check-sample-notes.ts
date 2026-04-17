import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSampleNotes() {
  try {
    const project = await prisma.project.findUnique({
      where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
      include: {
        sampleItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!project) {
      console.log('Project not found');
      return;
    }

    console.log(`Project: ${project.title}`);
    console.log(`Total sample items: ${project.sampleItems.length}\n`);

    const itemsWithNotes = project.sampleItems.filter(item => item.notes && item.notes.trim());
    console.log(`Sample items with notes: ${itemsWithNotes.length}\n`);

    if (itemsWithNotes.length > 0) {
      console.log('Items with notes:');
      itemsWithNotes.forEach(item => {
        const notePreview = item.notes ? item.notes.substring(0, 50) : '';
        console.log(`- ${item.title}: ${notePreview}...`);
      });
    } else {
      console.log('No sample items have notes.');
    }

    console.log('\n--- All sample items ---');
    project.sampleItems.forEach(item => {
      console.log(`${item.orderIndex + 1}. ${item.title} - Notes: ${item.notes ? 'YES' : 'NO'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSampleNotes();