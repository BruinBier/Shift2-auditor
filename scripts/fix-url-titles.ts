import { prisma } from '../lib/prisma';

async function fixUrlTitles() {
  // Get all URLs with titles
  const urls = await prisma.projectScopeUrl.findMany({
    where: {
      title: {
        not: null,
      },
    },
  });

  console.log(`Found ${urls.length} URLs with titles`);

  let fixedCount = 0;

  for (const url of urls) {
    if (!url.title) continue;

    let newTitle = url.title;

    // Remove "ToegankelijkheidToegankelijkheid" (duplicate)
    newTitle = newTitle.replace(/ToegankelijkheidToegankelijkheid/gi, '');

    // Remove "Loading..."
    newTitle = newTitle.replace(/Loading\.\.\./gi, '');

    // Remove trailing/leading whitespace
    newTitle = newTitle.trim();

    if (newTitle !== url.title) {
      console.log(`Fixing: "${url.title}"`);
      console.log(`     -> "${newTitle}"`);
      console.log(`  URL: ${url.url}\n`);

      await prisma.projectScopeUrl.update({
        where: { id: url.id },
        data: { title: newTitle },
      });

      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} URL titles`);

  await prisma.$disconnect();
}

fixUrlTitles();