import { prisma } from '../lib/prisma';

async function checkProjectTitle() {
  const project = await prisma.project.findUnique({
    where: { id: 'e7ab285e-b67f-4c01-b2bf-7f00cd58bcca' },
  });

  if (project) {
    console.log('Project title:', project.title);
  } else {
    console.log('Project not found');
  }

  await prisma.$disconnect();
}

checkProjectTitle();