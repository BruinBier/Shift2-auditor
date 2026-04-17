import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProject() {
  const projectId = '52589c23-e76c-4a5f-bbaa-e0dcd4bbf1ee';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scopeUrls: {
        orderBy: { url: 'asc' },
      },
    },
  });

  if (!project) {
    console.error('Project not found');
    return;
  }

  console.log('Project:', project.title);
  console.log('Subject:', project.subject);
  console.log('Research Type:', project.researchType);
  console.log('\nScope URLs:');

  if (project.scopeUrls.length === 0) {
    console.log('  ❌ No scope URLs found!');
  } else {
    project.scopeUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url.url} (inScope: ${url.inScope})`);
    });
  }

  const inScopeUrls = project.scopeUrls.filter(u => u.inScope);
  const firstUrl = inScopeUrls[0]?.url;

  console.log('\nFirst in-scope URL:', firstUrl || 'NONE');

  if (firstUrl) {
    try {
      const url = new URL(firstUrl);
      const websiteUrl = `${url.protocol}//${url.host}`;
      console.log('Website URL:', websiteUrl);
      console.log('\nReport intro would be:');
      console.log(`Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content van de formulieren op ${websiteUrl}`);
    } catch (e) {
      console.error('Failed to parse URL:', e);
    }
  }

  await prisma.$disconnect();
}

checkProject().catch(console.error);