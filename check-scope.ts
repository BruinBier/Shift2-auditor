import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScope() {
  const project = await prisma.project.findUnique({
    where: { id: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    include: {
      scopeUrls: {
        orderBy: { url: 'asc' },
      },
      sampleItems: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (project) {
    console.log('Project:', project.title);
    console.log('\nScope URLs:', project.scopeUrls.length);
    project.scopeUrls.forEach((url, i) => {
      console.log(`  ${i+1}. ${url.url} (in scope: ${url.inScope})`);
    });
    
    console.log('\nSample Items:', project.sampleItems.length);
    project.sampleItems.forEach((item, i) => {
      console.log(`  ${i+1}. ${item.title}`);
    });
  }

  await prisma.$disconnect();
}

checkScope();
