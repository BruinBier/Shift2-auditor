import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDiscoveredUrls() {
  console.log('Starting to fix discovered URLs...\n');

  try {
    // Get all scope URLs
    const allUrls = await prisma.projectScopeUrl.findMany({
      orderBy: { url: 'asc' },
    });

    console.log(`Found ${allUrls.length} scope URLs\n`);

    let updatedCount = 0;

    // Group URLs by project
    const projectUrls = new Map<string, typeof allUrls>();
    allUrls.forEach(url => {
      if (!projectUrls.has(url.projectId)) {
        projectUrls.set(url.projectId, []);
      }
      projectUrls.get(url.projectId)!.push(url);
    });

    // For each project
    for (const [projectId, urls] of projectUrls.entries()) {
      console.log(`\nProcessing project ${projectId} with ${urls.length} URLs`);

      // Find potential parent URLs (usually shorter URLs)
      // Sort by URL length
      const sortedUrls = [...urls].sort((a, b) => {
        return a.url.length - b.url.length;
      });

      // The shortest URL is likely the parent
      const potentialParent = sortedUrls[0];

      if (!potentialParent) continue;

      console.log(`  Potential parent: ${potentialParent.url}`);

      // Find all URLs that start with the parent's domain
      const parentDomain = new URL(potentialParent.url).origin;

      for (const url of urls) {
        // Skip if it's the parent itself
        if (url.id === potentialParent.id) continue;

        // Check if this URL is from the same domain
        try {
          const urlDomain = new URL(url.url).origin;

          if (urlDomain === parentDomain && url.url !== potentialParent.url) {
            // This is likely a discovered URL
            await prisma.projectScopeUrl.update({
              where: { id: url.id },
              data: { parentUrlId: potentialParent.id },
            });

            console.log(`    ✓ Linked ${url.url} to parent`);
            updatedCount++;
          }
        } catch (error) {
          console.log(`    ✗ Invalid URL: ${url.url}`);
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} discovered URL(s)`);
  } catch (error) {
    console.error('❌ Error fixing discovered URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixDiscoveredUrls()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
