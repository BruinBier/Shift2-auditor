import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProjects() {
  const projects = await prisma.project.findMany({
    where: {
      researchType: {
        contains: 'formulieren'
      }
    },
    include: {
      scopeUrls: {
        where: {
          inScope: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  console.log('Recent formulieren projects:\n');

  projects.forEach(p => {
    const firstUrl = p.scopeUrls[0]?.url || '❌ NO URLS';
    console.log(p.id);
    console.log('  Title:', p.title);
    console.log('  First in-scope URL:', firstUrl);
    console.log('');
  });

  await prisma.$disconnect();
}

listProjects().catch(console.error);