import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"') {
        if (insideQuotes && lines[i][j + 1] === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue); // Add last value

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      // Convert empty strings to null, parse dates
      if (value === '') {
        record[header] = null;
      } else if (header.endsWith('At') || header.endsWith('Date')) {
        record[header] = new Date(value);
      } else if (value === 'true') {
        record[header] = true;
      } else if (value === 'false') {
        record[header] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        record[header] = Number(value);
      } else {
        record[header] = value;
      }
    });
    records.push(record);
  }

  return records;
}

async function importTable(backupDir: string, tableName: string, prismaModel: any) {
  const filePath = path.join(backupDir, `${tableName}.csv`);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  ${tableName}.csv not found, skipping...`);
    return 0;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parseCSV(content);

  if (records.length === 0) {
    console.log(`  ℹ️  ${tableName}.csv is empty, skipping...`);
    return 0;
  }

  // Import records one by one to handle errors gracefully
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      await prismaModel.create({ data: record });
      imported++;
    } catch (error: any) {
      // If record already exists (unique constraint), skip it
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.error(`    ❌ Error importing record:`, error.message);
      }
    }
  }

  console.log(`  ✅ ${tableName}.csv (${imported} imported, ${skipped} skipped)`);
  return imported;
}

async function importAllData(backupDir: string) {
  console.log('\n📥 Starting data import...\n');

  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  // Check metadata
  const metadataPath = path.join(backupDir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log(`📋 Backup from: ${metadata.exportDate}`);
    console.log(`📊 Total records: ${Object.values(metadata.tables).reduce((a: any, b: any) => a + b, 0)}\n`);
  }

  try {
    // Import in correct order (respecting foreign keys)
    let totalImported = 0;

    // 1. Independent tables first
    totalImported += await importTable(backupDir, 'teams', prisma.team);
    totalImported += await importTable(backupDir, 'opdrachtgevers', prisma.opdrachtgever);
    totalImported += await importTable(backupDir, 'quick_findings', prisma.quickFinding);

    // 2. Projects (depends on opdrachtgevers, teams)
    totalImported += await importTable(backupDir, 'projects', prisma.project);

    // 3. Project-related tables
    totalImported += await importTable(backupDir, 'client_projects', prisma.clientProject);
    totalImported += await importTable(backupDir, 'project_notes', prisma.projectNote);
    totalImported += await importTable(backupDir, 'sample_items', prisma.sampleItem);
    totalImported += await importTable(backupDir, 'project_scope_urls', prisma.projectScopeUrl);
    totalImported += await importTable(backupDir, 'criterion_assessments', prisma.criterionAssessment);
    totalImported += await importTable(backupDir, 'crawler_runs', prisma.crawlerRun);

    // 4. Findings (depends on projects, quick_findings)
    totalImported += await importTable(backupDir, 'findings', prisma.finding);

    // 5. Finding-related tables (depends on findings)
    totalImported += await importTable(backupDir, 'finding_urls', prisma.findingUrl);
    totalImported += await importTable(backupDir, 'finding_occurrences', prisma.findingOccurrence);

    // 6. Crawler results (depends on scope_urls)
    totalImported += await importTable(backupDir, 'crawler_results', prisma.crawlerResult);

    console.log(`\n✅ Import complete! Total records imported: ${totalImported}\n`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup directory from command line argument
const backupDir = process.argv[2];

if (!backupDir) {
  console.error('\n❌ Error: Please provide backup directory path\n');
  console.log('Usage: npm run import-data <backup-directory>');
  console.log('Example: npm run import-data backups/backup-2026-02-01\n');
  process.exit(1);
}

importAllData(backupDir);
