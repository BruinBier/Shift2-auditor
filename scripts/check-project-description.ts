import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDescription() {
  const project = await prisma.project.findUnique({
    where: { id: '56a7ffd4-12ad-4972-ad3e-59d9250e0fba' },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project:', project.title);
  console.log('Description in database:', project.description || '(empty)');
  console.log('Description length:', project.description?.length || 0);
}

checkDescription()
  .catch(console.error)
  .finally(() => prisma.$disconnect());