import { prisma } from '../lib/prisma';

async function checkScopeUrls() {
  const scopeUrls = await prisma.projectScopeUrl.findMany({
    where: { projectId: 'dfc078cf-a6b5-4c92-b72e-15d5d1089804' },
    orderBy: { url: 'asc' }
  });

  console.log('Total scope URLs:', scopeUrls.length);
  console.log('\n');

  scopeUrls.forEach(u => {
    const status = u.inScope ? 'IN SCOPE' : 'OUT OF SCOPE';
    console.log(`${status}: ${u.url}`);
  });

  await prisma.$disconnect();
}

checkScopeUrls().catch(console.error);