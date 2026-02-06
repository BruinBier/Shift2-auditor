import { prisma } from '../lib/prisma';

async function recreateFinding() {
  const projectId = 'd0d6504f-e0f0-48c3-95a4-4e25df146fc1';

  console.log('Deleting old finding B001...\n');

  // Delete the old finding
  const oldFinding = await prisma.finding.findFirst({
    where: {
      projectId,
      findingCode: 'B001',
    },
  });

  if (oldFinding) {
    await prisma.finding.delete({
      where: { id: oldFinding.id },
    });
    console.log('✓ Deleted B001\n');
  } else {
    console.log('No B001 found\n');
  }

  console.log('Creating new finding with details...\n');

  // Call the API to recreate the finding
  const scopeUrlId = '62573e58-c989-406b-895c-4e4ca1c70142';

  const response = await fetch(
    `http://localhost:3000/api/projects/${projectId}/scope-urls/${scopeUrlId}/auto-create-findings`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log('✅ SUCCESS!');
    console.log(`Message: ${data.message}`);
    console.log(`Findings created: ${data.findingsCreated}`);
  } else {
    console.log('❌ ERROR:', data);
  }

  await prisma.$disconnect();
}

recreateFinding();
