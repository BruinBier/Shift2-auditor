import { prisma } from '../lib/prisma';

async function checkB001() {
  const finding = await prisma.finding.findFirst({
    where: { findingCode: 'B001' },
    include: {
      affectedUrls: {
        include: {
          scopeUrl: true,
        },
      },
    },
  });

  if (!finding) {
    console.log('❌ Finding B001 not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Finding B001:');
  console.log('');
  console.log(`Code: ${finding.findingCode}`);
  console.log(`Status: ${finding.status}`);
  console.log(`Impact: ${finding.impact}`);
  console.log('');
  console.log('Description:');
  console.log('─'.repeat(80));
  console.log(finding.description);
  console.log('─'.repeat(80));
  console.log('');
  console.log(`Affected URLs: ${finding.affectedUrls.length}`);
  finding.affectedUrls.forEach((au) => {
    console.log(`  - ${au.scopeUrl.url}`);
  });

  await prisma.$disconnect();
}

checkB001();
