import { PrismaClient } from '@prisma/client';

async function listDatabases() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔍 Alle PostgreSQL databases op deze server:\n');

    const databases = await prisma.$queryRaw<any[]>`
      SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
      FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname;
    `;

    databases.forEach(db => {
      console.log(`  📁 ${db.datname} (${db.size})`);
    });

    console.log('\n---\n');
    console.log('Huidige database: shift2_auditor');

    // Check if there's a shadow database
    const shadowDbExists = databases.some(db =>
      db.datname.includes('shadow') || db.datname.includes('shift2'));

    if (shadowDbExists) {
      console.log('\n⚠️  Er zijn mogelijke shadow/development databases gevonden!');
    }

  } catch (error) {
    console.error('❌ Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listDatabases();