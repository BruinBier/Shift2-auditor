import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'dfc078cf-a6b5-4c92-b72e-15d5d1089804';

  console.log('Checking scope URLs for project...\n');

  const scopeUrls = await prisma.projectScopeUrl.findMany({
    where: { projectId },
    orderBy: { url: 'asc' }
  });

  console.log(`Found ${scopeUrls.length} scope URLs:\n`);

  scopeUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url.url}`);
    console.log(`   ID: ${url.id}`);
    console.log(`   inScope: ${url.inScope}`);
    console.log(`   parentUrlId: ${url.parentUrlId || 'null'}`);
    console.log(`   createdAt: ${url.createdAt}`);
    console.log('');
  });

  // Count in-scope URLs without parent
  const inScopeRootUrls = scopeUrls.filter(u => u.inScope && !u.parentUrlId);
  console.log(`\nIn-scope root URLs (no parent): ${inScopeRootUrls.length}`);
  inScopeRootUrls.forEach(url => {
    console.log(`  - ${url.url}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });