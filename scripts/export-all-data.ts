import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Create backup directory with UNIQUE timestamp (date + time)
function createUniqueBackupDir(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '-')
    .replace(/:/g, '-')
    .replace(/\.\d+Z$/, '')
    .substring(0, 19); // Format: YYYY-MM-DD-HH-MM-SS

  let backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);
  let counter = 1;

  // If directory exists (extremely rare), add counter
  while (fs.existsSync(backupDir)) {
    backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}-${counter}`);
    counter++;
  }

  return backupDir;
}

const backupDir = createUniqueBackupDir();

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  // Datums als ISO, niet als `String(date)`.
  //
  // Die laatste schrijft "Tue Sep 15 2026 13:10:52 GMT+0200 (Midden-Europese zomertijd)":
  // de milliseconden vallen weg en de naam van de tijdzone staat er in de taal van de
  // machine. Bij een herstel werd 10:03:10.366 dus 10:03:10.000, en dat is precies het
  // verschil waarop records uit dezelfde seconde gesorteerd staan.
  const str = value instanceof Date ? value.toISOString() : String(value);
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(data: any[], headers: string[]): string {
  const headerRow = headers.join(',');
  const rows = data.map(row =>
    headers.map(header => escapeCSV(row[header])).join(',')
  );
  return [headerRow, ...rows].join('\n');
}

/**
 * De kolommen van een tabel, afgeleid uit het schema.
 *
 * Ze stonden hier met de hand onder elk `exportTable`. Dat liep achter: op 16 september
 * 2026 exporteerde `projects` 19 van de 76 velden, en alles wat er sindsdien bij was
 * gekomen -- de scopevelden, de voorbereidingsstappen, de rapportteksten -- stond niet in
 * de backup. Niemand merkt zoiets, want het bestand is er en heeft rijen.
 *
 * Nu leest hij het schema. Een veld dat erbij komt gaat vanzelf mee, en een veld dat
 * verdwijnt kan geen dode kolom meer achterlaten.
 *
 * Relaties (`kind: 'object'`) slaan we over: die staan als losse tabel in de backup, en de
 * vreemde sleutel (`scalar`) gaat gewoon mee.
 */
function kolommenVan(model: string): string[] {
  const dmmf = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
  if (!dmmf) throw new Error(`Model ${model} staat niet in het schema`);
  return dmmf.fields.filter((f) => f.kind !== 'object').map((f) => f.name);
}

async function exportTable(tableName: string, data: any[], model: string) {
  const headers = kolommenVan(model);
  const csv = arrayToCSV(data, headers);
  const filePath = path.join(backupDir, `${tableName}.csv`);
  fs.writeFileSync(filePath, csv, 'utf-8');
  console.log(`  ✅ ${tableName}.csv (${data.length} records, ${headers.length} kolommen)`);
}

async function exportAllData() {
  console.log('\n📦 Starting data export...\n');
  ensureDir(backupDir);

  try {
    // 1. Opdrachtgevers
    const opdrachtgevers = await prisma.opdrachtgever.findMany();
    await exportTable('opdrachtgevers', opdrachtgevers, 'Opdrachtgever');

    // 2. Projects
    const projects = await prisma.project.findMany();
    await exportTable('projects', projects, 'Project');

    // 3. Project Notes
    const projectNotes = await prisma.projectNote.findMany();
    await exportTable('project_notes', projectNotes, 'ProjectNote');

    // 4. Findings
    const findings = await prisma.finding.findMany();
    await exportTable('findings', findings, 'Finding');

    // 5. Finding URLs
    const findingUrls = await prisma.findingUrl.findMany();
    await exportTable('finding_urls', findingUrls, 'FindingUrl');

    // 6. Finding Occurrences (for backward compatibility)
    const findingOccurrences = await prisma.findingOccurrence.findMany();
    await exportTable('finding_occurrences', findingOccurrences, 'FindingOccurrence');

    // 7. Sample Items
    const sampleItems = await prisma.sampleItem.findMany();
    await exportTable('sample_items', sampleItems, 'SampleItem');

    // 8. Project Scope URLs
    const scopeUrls = await prisma.projectScopeUrl.findMany();
    await exportTable('project_scope_urls', scopeUrls, 'ProjectScopeUrl');

    // 9. Crawler Results
    const crawlerResults = await prisma.crawlerResult.findMany();
    await exportTable('crawler_results', crawlerResults, 'CrawlerResult');

    // 10. Crawler Runs
    const crawlerRuns = await prisma.crawlerRun.findMany();
    await exportTable('crawler_runs', crawlerRuns, 'CrawlerRun');

    // 11. Criterion Assessments
    const criterionAssessments = await prisma.criterionAssessment.findMany();
    await exportTable('criterion_assessments', criterionAssessments, 'CriterionAssessment');

    // 12. QuickFindings (templates)
    const quickFindings = await prisma.quickFinding.findMany();
    await exportTable('quick_findings', quickFindings, 'QuickFinding');

    // 13. Teams
    const teams = await prisma.team.findMany();
    await exportTable('teams', teams, 'Team');

    // 14. Client Projects
    const clientProjects = await prisma.clientProject.findMany();
    await exportTable('client_projects', clientProjects, 'ClientProject');

    const technicalIssues = await prisma.technicalIssue.findMany();
    await exportTable('technical_issues', technicalIssues, 'TechnicalIssue');

    // 16. Sampleoordelen — het oordeel per sample per criterium.
    // Ontbrak in deze export zolang de tabel niet in schema.prisma stond, terwijl
    // het de grootste verzameling onderzoeksresultaten van het hele systeem is.
    const criterionChecks = await prisma.sampleCriterionCheck.findMany();
    await exportTable('sample_criterion_checks', criterionChecks, 'SampleCriterionCheck');

    // 17. Waarnemingen — de ruwe observaties van de onderzoeker.
    const waarnemingen = await prisma.waarneming.findMany();
    await exportTable('waarnemingen', waarnemingen, 'Waarneming');

    // 18. Planningswijzigingen — stond evenmin in het schema, dus evenmin hierin.
    const planningChanges = await prisma.projectPlanningChange.findMany();
    await exportTable('project_planning_changes', planningChanges, 'ProjectPlanningChange');

    // 19. Bespreekpunten -- wat je de klant nog moet vragen, en wat eruit kwam.
    //
    // Stond hier niet in, terwijl een afgevinkt punt de vastlegging is van wat er wanneer
    // met de klant is afgestemd. Sinds 16 september 2026 zit er bovendien een
    // verwijderknop op de open punten, dus er kan nu ook iets weg.
    const bespreekpunten = await prisma.bespreekpunt.findMany();
    await exportTable('bespreekpunten', bespreekpunten, 'Bespreekpunt');

    // 20. Klantafspraken -- wat er uit een gesprek kwam en waar je op terugkomt.
    const klantafspraken = await prisma.klantafspraak.findMany();
    await exportTable('klantafspraken', klantafspraken, 'Klantafspraak');

    // Create metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      database: 'shift2_auditor',
      tables: {
        opdrachtgevers: opdrachtgevers.length,
        projects: projects.length,
        project_notes: projectNotes.length,
        findings: findings.length,
        finding_urls: findingUrls.length,
        finding_occurrences: findingOccurrences.length,
        sample_items: sampleItems.length,
        project_scope_urls: scopeUrls.length,
        crawler_results: crawlerResults.length,
        crawler_runs: crawlerRuns.length,
        criterion_assessments: criterionAssessments.length,
        quick_findings: quickFindings.length,
        teams: teams.length,
        client_projects: clientProjects.length,
        technical_issues: technicalIssues.length,
        sample_criterion_checks: criterionChecks.length,
        waarnemingen: waarnemingen.length,
        project_planning_changes: planningChanges.length,
        bespreekpunten: bespreekpunten.length,
        klantafspraken: klantafspraken.length,
      }
    };

    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Create README
    const backupName = path.basename(backupDir);
    const readme = `# Shift2 Auditor Data Backup

**Export Date:** ${new Date().toISOString()}
**Backup Name:** ${backupName}

## Contents

This backup contains all data from the Shift2 Auditor application in CSV format.

### Tables Exported:
- opdrachtgevers.csv (${opdrachtgevers.length} records)
- projects.csv (${projects.length} records)
- project_notes.csv (${projectNotes.length} records)
- findings.csv (${findings.length} records)
- finding_urls.csv (${findingUrls.length} records)
- finding_occurrences.csv (${findingOccurrences.length} records)
- sample_items.csv (${sampleItems.length} records)
- project_scope_urls.csv (${scopeUrls.length} records)
- crawler_results.csv (${crawlerResults.length} records)
- crawler_runs.csv (${crawlerRuns.length} records)
- criterion_assessments.csv (${criterionAssessments.length} records)
- quick_findings.csv (${quickFindings.length} records)
- teams.csv (${teams.length} records)
- client_projects.csv (${clientProjects.length} records)

## Import Instructions

**IMPORTANT: Always seed base data first!**

To restore this backup:

\`\`\`bash
# 1. FIRST: Seed base data (WCAG criteria + research types)
npm run db:seed

# 2. THEN: Restore your project data
npm run restore backups/${backupName}
\`\`\`

## Notes

- This backup is safe to commit to git
- All data is in CSV format for easy viewing and diffing
- The metadata.json file contains export information
- **Unique backup name ensures no overwrites**
`;

    fs.writeFileSync(
      path.join(backupDir, 'README.md'),
      readme,
      'utf-8'
    );

    console.log('\n✅ Export complete!\n');
    console.log(`📁 Backup location: ${backupDir}\n`);
    console.log('💡 You can now commit this backup to git for version control.\n');

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportAllData();
