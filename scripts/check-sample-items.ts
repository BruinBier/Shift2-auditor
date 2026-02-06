import { prisma } from '../lib/prisma';

async function checkSampleItems() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Checking sample items for project...\n');

  const sampleItems = await prisma.sampleItem.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'desc' },
  });

  console.log(`Total sample items: ${sampleItems.length}\n`);

  if (sampleItems.length === 0) {
    console.log('❌ No sample items found!');
    console.log('\nYou need to:');
    console.log('  1. Go to Crawler Overview page');
    console.log('  2. Click the purple + button next to a URL');
    console.log('  3. This will add it to the sample AND create findings');
  } else {
    console.log('✅ Sample items found:\n');
    sampleItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`);
      console.log(`   URL: ${item.url || 'N/A'}`);
      console.log(`   Type: ${item.sampleType}`);
      console.log('');
    });

    // Check if WOZ page is in sample
    const wozItem = sampleItems.find(item =>
      item.url?.includes('woz-waarde')
    );

    if (wozItem) {
      console.log('✓ WOZ-waarde page IS in the sample!');
      console.log('  But no findings were created. Let me check why...\n');

      // Check if there's a scope URL for this
      const scopeUrl = await prisma.projectScopeUrl.findFirst({
        where: {
          projectId,
          url: wozItem.url || '',
        },
      });

      if (scopeUrl) {
        console.log(`  Scope URL ID: ${scopeUrl.id}`);
        console.log('  You can manually trigger finding creation by calling:');
        console.log(`  POST /api/projects/${projectId}/scope-urls/${scopeUrl.id}/auto-create-findings`);
      }
    } else {
      console.log('❌ WOZ-waarde page NOT in sample yet');
    }
  }

  await prisma.$disconnect();
}

checkSampleItems();
