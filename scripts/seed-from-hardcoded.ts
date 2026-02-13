import { PrismaClient } from '@prisma/client';
import { QUICK_FINDINGS } from '../lib/quick-findings-data';

const prisma = new PrismaClient();

async function seedFromHardcoded() {
  try {
    console.log('🌱 Seeding quick findings from hardcoded data...');
    
    // Clear existing
    const deleted = await prisma.quickFinding.deleteMany();
    console.log(`🗑️  Deleted ${deleted.count} existing quick findings`);
    
    // Insert all from hardcoded
    let count = 0;
    for (const finding of QUICK_FINDINGS) {
      await prisma.quickFinding.create({
        data: {
          id: finding.id,
          title: finding.title,
          description: finding.description,
          advice: finding.advice,
          criterionCode: finding.criterionCode,
          keywords: finding.keywords || null,
          crawler: finding.crawler || false,
          crawlerTestId: finding.crawlerTestId || null,
          status: finding.status as any || null,
          impact: finding.impact as any || null,
          responsibility: finding.responsibility as any || null,
        }
      });
      count++;
      console.log(`  ✓ ${count}. ${finding.title}`);
    }
    
    console.log(`\n✅ Successfully seeded ${count} quick findings!`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedFromHardcoded();
