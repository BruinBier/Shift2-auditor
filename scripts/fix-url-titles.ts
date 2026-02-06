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

    // Remove any trailing "Toegankelijkheid" or "Toegankelijk"
    // that appears after domain names or page titles
    newTitle = newTitle.replace(/Toegankelijkheid$/gi, '');
    newTitle = newTitle.replace(/Toegankelijk$/gi, '');

    // Remove duplicate words at the end (e.g., "ToegankelijkToegankelijk")
    // This regex finds repeated words (3+ chars) at the end
    newTitle = newTitle.replace(/(\w{3,})\1+$/gi, '$1');

    // Remove "ToegankelijkheidToegankelijkheid" (duplicate)
    newTitle = newTitle.replace(/ToegankelijkheidToegankelijkheid/gi, 'Toegankelijkheid');

    // Remove "ToegankelijkToegankelijk" (duplicate)
    newTitle = newTitle.replace(/ToegankelijkToegankelijk/gi, 'Toegankelijk');

    // Remove "Loading..."
    newTitle = newTitle.replace(/Loading\.\.\./gi, '');

    // Remove trailing/leading whitespace and periods
    newTitle = newTitle.trim().replace(/\s*\.\s*$/g, '');

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