import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Per model: welk veld welk type heeft, uit het schema.
 *
 * De omzetting ging op de naam van de kolom: alles op `At` of `Date` werd een datum.
 * Negentien van de 33 datumvelden vielen daarbuiten -- `besprokenOp`, `akkoordOp`,
 * `scopeCallHeld`, `dateStart` -- en kwamen als tekst binnen, waarop Prisma het record
 * weigerde. Andersom werd een kenmerk als "02" een getal.
 *
 * Nu leest hij het schema, net als de export.
 */
function typenVan(model: string): Map<string, string> {
  const dmmf = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
  if (!dmmf) throw new Error(`Model ${model} staat niet in het schema`);
  return new Map(dmmf.fields.filter((f) => f.kind !== 'object').map((f) => [f.name, f.type]));
}

function parseCSV(content: string, typen?: Map<string, string>): any[] {
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
      const type = typen?.get(header);
      if (value === '') {
        record[header] = null;
      } else if (type === 'DateTime') {
        record[header] = new Date(value);
      } else if (type === 'Boolean') {
        record[header] = value === 'true';
      } else if (type === 'Int') {
        record[header] = parseInt(value, 10);
      } else if (type === 'Float' || type === 'Decimal') {
        record[header] = Number(value);
      } else if (type) {
        // String, enum, Json: laat staan zoals het er staat. Een kenmerk als "02" of een
        // postcode mag geen getal worden.
        record[header] = value;
      } else if (header.endsWith('At') || header.endsWith('Date')) {
        // Kolom die niet in het schema staat: oude backup. Zelfde gok als vroeger.
        record[header] = new Date(value);
      } else if (value === 'true') {
        record[header] = true;
      } else if (value === 'false') {
        record[header] = false;
      } else if (!isNaN(Number(value))) {
        record[header] = Number(value);
      } else {
        record[header] = value;
      }
    });
    records.push(record);
  }

  return records;
}

async function importTable(backupDir: string, tableName: string, prismaModel: any, model: string) {
  const filePath = path.join(backupDir, `${tableName}.csv`);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  ${tableName}.csv not found, skipping...`);
    return 0;
  }

  const typen = typenVan(model);
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parseCSV(content, typen);

  // Een oudere backup kan kolommen bevatten die het schema niet meer kent. Die lieten
  // Prisma het hele record weigeren; nu vallen ze weg, met één melding in plaats van
  // één per rij.
  const onbekend = Object.keys(records[0] ?? {}).filter((k) => !typen.has(k));
  if (onbekend.length) {
    console.log(`  ℹ️  ${tableName}: kolommen niet meer in het schema, overgeslagen: ${onbekend.join(', ')}`);
    for (const r of records) for (const k of onbekend) delete r[k];
  }

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
    totalImported += await importTable(backupDir, 'teams', prisma.team, 'Team');
    totalImported += await importTable(backupDir, 'opdrachtgevers', prisma.opdrachtgever, 'Opdrachtgever');
    totalImported += await importTable(backupDir, 'quick_findings', prisma.quickFinding, 'QuickFinding');
    // Hangt alleen aan de WCAG-criteria, en die zijn geseed. Staat los van de projecten:
    // het zijn functionele fouten die naar de leverancier moeten.
    totalImported += await importTable(backupDir, 'technical_issues', prisma.technicalIssue, 'TechnicalIssue');

    // 2. Projects (depends on opdrachtgevers, teams)
    totalImported += await importTable(backupDir, 'projects', prisma.project, 'Project');

    // 3. Project-related tables
    totalImported += await importTable(backupDir, 'client_projects', prisma.clientProject, 'ClientProject');
    totalImported += await importTable(backupDir, 'project_notes', prisma.projectNote, 'ProjectNote');
    totalImported += await importTable(backupDir, 'sample_items', prisma.sampleItem, 'SampleItem');
    totalImported += await importTable(backupDir, 'project_scope_urls', prisma.projectScopeUrl, 'ProjectScopeUrl');
    totalImported += await importTable(backupDir, 'criterion_assessments', prisma.criterionAssessment, 'CriterionAssessment');
    totalImported += await importTable(backupDir, 'crawler_runs', prisma.crawlerRun, 'CrawlerRun');
    // Hangt alleen aan het project, dus hij kan hier meteen mee. Sinds 16 september 2026
    // kan een open bespreekpunt verwijderd worden; dan wil je hem ook terug kunnen zetten.
    totalImported += await importTable(backupDir, 'bespreekpunten', prisma.bespreekpunt, 'Bespreekpunt');
    totalImported += await importTable(backupDir, 'klantafspraken', prisma.klantafspraak, 'Klantafspraak');
    totalImported += await importTable(backupDir, 'project_planning_changes', prisma.projectPlanningChange, 'ProjectPlanningChange');

    // 4. Findings (depends on projects, quick_findings)
    totalImported += await importTable(backupDir, 'findings', prisma.finding, 'Finding');

    // 5. Finding-related tables (depends on findings)
    totalImported += await importTable(backupDir, 'finding_urls', prisma.findingUrl, 'FindingUrl');
    totalImported += await importTable(backupDir, 'finding_occurrences', prisma.findingOccurrence, 'FindingOccurrence');

    // 6. Crawler results (depends on scope_urls)
    totalImported += await importTable(backupDir, 'crawler_results', prisma.crawlerResult, 'CrawlerResult');

    // 7. Het oordeel per sample per criterium, en de losse waarnemingen.
    //
    // Deze vier tabellen werden wel geëxporteerd maar niet teruggezet: een herstel liet
    // ze zonder melding weg, en bij sample_criterion_checks gaat het om het hele
    // dekkingsoverzicht. Ze staan hier onderaan omdat ze aan sample items en findings
    // hangen, en die moeten er eerst zijn.
    totalImported += await importTable(backupDir, 'sample_criterion_checks', prisma.sampleCriterionCheck, 'SampleCriterionCheck');
    totalImported += await importTable(backupDir, 'waarnemingen', prisma.waarneming, 'Waarneming');

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
