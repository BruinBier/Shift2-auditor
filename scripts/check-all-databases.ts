import { PrismaClient } from '@prisma/client';

async function checkAllDatabases() {
  // Check if there are other databases or schemas
  const prisma = new PrismaClient();

  try {
    console.log('\n🔍 Checking database information...\n');

    const result = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename;
    `;

    console.log('📊 Tabellen in database:\n');
    result.forEach(row => {
      console.log(`  ${row.schemaname}.${row.tablename}`);
    });

    // Check if there's any data in unexpected places
    const allSchemas = await prisma.$queryRaw<any[]>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast');
    `;

    console.log('\n📁 Alle schemas:\n');
    allSchemas.forEach(schema => {
      console.log(`  - ${schema.schema_name}`);
    });

  } catch (error) {
    console.error('❌ Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllDatabases();