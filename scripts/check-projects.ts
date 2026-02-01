import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    const projectCount = await prisma.project.count();
    console.log(`\n📊 Aantal projecten in database: ${projectCount}\n`);

    if (projectCount > 0) {
      const projects = await prisma.project.findMany({
        take: 10,
        select: {
          id: true,
          kenmerk: true,
          title: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('Laatste 10 projecten:');
      projects.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title} (${p.kenmerk || 'geen kenmerk'})`);
      });
    } else {
      console.log('⚠️  WAARSCHUWING: Geen projecten gevonden in database!');
    }

    // Check other important tables
    const opdrachtgeverCount = await prisma.opdrachtgever.count();
    const findingCount = await prisma.finding.count();
    const quickFindingCount = await prisma.quickFinding.count();

    console.log(`\n📈 Andere tabellen:`);
    console.log(`   Opdrachtgevers: ${opdrachtgeverCount}`);
    console.log(`   Findings: ${findingCount}`);
    console.log(`   QuickFindings: ${quickFindingCount}`);
  } catch (error) {
    console.error('❌ Fout bij ophalen data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();