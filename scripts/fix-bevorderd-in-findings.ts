import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fix "bevorderd" → "bevordert" in Finding.advice for all projects
 */

async function fixBevorderd() {
  try {
    console.log('🔍 Finding all Finding records with "bevorderd" in advice...\n');

    // Find all findings with "bevorderd" in advice
    const findings = await prisma.finding.findMany({
      where: {
        advice: {
          contains: 'bevorderd',
        },
      },
      select: {
        id: true,
        findingCode: true,
        advice: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log(`Found ${findings.length} findings with "bevorderd" in advice text\n`);

    if (findings.length === 0) {
      console.log('✅ No findings need updating!');
      return;
    }

    console.log('=== BEFORE ===');
    findings.forEach((finding, index) => {
      console.log(`${index + 1}. [${finding.project.title}] ${finding.findingCode}`);
      const preview = finding.advice.substring(0, 200);
      console.log(`   "${preview}..."\n`);
    });

    // Update each finding
    let count = 0;
    for (const finding of findings) {
      const updatedAdvice = finding.advice.replace(/bevorderd/g, 'bevordert');

      await prisma.finding.update({
        where: { id: finding.id },
        data: { advice: updatedAdvice },
      });

      count++;
      console.log(`✓ Updated ${count}/${findings.length}: ${finding.findingCode}`);
    }

    console.log(`\n✅ Successfully updated ${count} findings!`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixBevorderd();