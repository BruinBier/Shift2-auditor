import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findProjects() {
  const projects = await prisma.project.findMany({
    where: {
      researchType: {
        contains: 'formulieren',
      },
    },
    include: {
      _count: {
        select: {
          scopeUrls: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log('Recent formulieren projects:\n');

  projects.forEach((project) => {
    console.log(`${project.id}`);
    console.log(`  Title: ${project.title}`);
    console.log(`  Subject: ${project.subject}`);
    console.log(`  Scope URLs: ${project._count.scopeUrls}`);
    console.log(`  Created: ${project.createdAt.toISOString()}`);
    console.log('');
  });

  const projectWithUrls = projects.find(p => p._count.scopeUrls > 0);

  if (projectWithUrls) {
    console.log(`\nRecommend testing with project: ${projectWithUrls.id}`);
  } else {
    console.log('\n⚠️ No formulieren projects found with scope URLs');
  }

  await prisma.$disconnect();
}

findProjects().catch(console.error);