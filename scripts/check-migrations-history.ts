import { PrismaClient } from '@prisma/client';

async function checkMigrations() {
  const prisma = new PrismaClient();

  try {
    console.log('\n📜 Prisma migrations geschiedenis:\n');

    const migrations = await prisma.$queryRaw<any[]>`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 20;
    `;

    migrations.forEach(m => {
      const date = m.finished_at ? new Date(m.finished_at).toLocaleString('nl-NL') : 'nog niet voltooid';
      console.log(`  ${m.migration_name}`);
      console.log(`    └─ ${date} (${m.applied_steps_count} steps)\n`);
    });

    // Check when the last migration with actual data would have been
    console.log('\n💡 TIP: Als er recent een migration is uitgevoerd die mislukte,');
    console.log('   kan dat data verlies hebben veroorzaakt.\n');

  } catch (error) {
    console.error('❌ Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();