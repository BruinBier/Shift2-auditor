import { PrismaClient } from '@prisma/client';
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
  const str = String(value);
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

async function exportTable(tableName: string, data: any[], headers: string[]) {
  const csv = arrayToCSV(data, headers);
  const filePath = path.join(backupDir, `${tableName}.csv`);
  fs.writeFileSync(filePath, csv, 'utf-8');
  console.log(`  ✅ ${tableName}.csv (${data.length} records)`);
}

async function exportAllData() {
  console.log('\n📦 Starting data export...\n');
  ensureDir(backupDir);

  try {
    // 1. Opdrachtgevers
    const opdrachtgevers = await prisma.opdrachtgever.findMany();
    await exportTable('opdrachtgevers', opdrachtgevers, [
      'id', 'name', 'address', 'zipcode', 'city', 'country', 'phone', 'email',
      'contactPerson', 'notes', 'createdAt', 'updatedAt'
    ]);

    // 2. Projects
    const projects = await prisma.project.findMany();
    await exportTable('projects', projects, [
      'id', 'kenmerk', 'title', 'description', 'opdrachtgeverId', 'researchType',
      'scope', 'sampleExplanation', 'browserInfo', 'assistiveTechnologyInfo',
      'startDate', 'endDate', 'teamId', 'conclusionScope', 'conclusionSample',
      'conclusionConformity', 'conclusionDiligence', 'createdAt', 'updatedAt'
    ]);

    // 3. Project Notes
    const projectNotes = await prisma.projectNote.findMany();
    await exportTable('project_notes', projectNotes, [
      'id', 'projectId', 'content', 'createdAt', 'updatedAt'
    ]);

    // 4. Findings
    const findings = await prisma.finding.findMany();
    await exportTable('findings', findings, [
      'id', 'projectId', 'findingCode', 'wcagCriterionId', 'quickFindingId',
      'status', 'impact', 'responsibility', 'description', 'advice', 'evidence',
      'notes', 'sortOrder', 'createdAt', 'updatedAt'
    ]);

    // 5. Finding URLs
    const findingUrls = await prisma.findingUrl.findMany();
    await exportTable('finding_urls', findingUrls, [
      'id', 'findingId', 'scopeUrlId', 'createdAt'
    ]);

    // 6. Finding Occurrences (for backward compatibility)
    const findingOccurrences = await prisma.findingOccurrence.findMany();
    await exportTable('finding_occurrences', findingOccurrences, [
      'id', 'findingId', 'sampleItemId', 'url', 'context'
    ]);

    // 7. Sample Items
    const sampleItems = await prisma.sampleItem.findMany();
    await exportTable('sample_items', sampleItems, [
      'id', 'projectId', 'sampleType', 'title', 'url', 'description',
      'orderIndex', 'makeScreenshot', 'screenshotPath', 'screenshotAlt', 'auditHtmlPath', 'auditCapturedAt', 'createdAt', 'updatedAt'
    ]);

    // 8. Project Scope URLs
    const scopeUrls = await prisma.projectScopeUrl.findMany();
    await exportTable('project_scope_urls', scopeUrls, [
      'id', 'projectId', 'url', 'title', 'crawlerType', 'inScope', 'note',
      'crawledAt', 'parentUrlId'
    ]);

    // 9. Crawler Results
    const crawlerResults = await prisma.crawlerResult.findMany();
    await exportTable('crawler_results', crawlerResults, [
      'id', 'scopeUrlId', 'testId', 'testName', 'found', 'count', 'details', 'createdAt'
    ]);

    // 10. Crawler Runs
    const crawlerRuns = await prisma.crawlerRun.findMany();
    await exportTable('crawler_runs', crawlerRuns, [
      'id', 'projectId', 'status', 'totalUrls', 'urlsProcessed', 'testsFound',
      'startedAt', 'completedAt', 'error'
    ]);

    // 11. Criterion Assessments
    const criterionAssessments = await prisma.criterionAssessment.findMany();
    await exportTable('criterion_assessments', criterionAssessments, [
      'id', 'projectId', 'wcagCriterionId', 'status', 'notes', 'createdAt', 'updatedAt'
    ]);

    // 12. QuickFindings (templates)
    const quickFindings = await prisma.quickFinding.findMany();
    await exportTable('quick_findings', quickFindings, [
      'id', 'title', 'description', 'advice', 'criterionCode', 'keywords',
      'crawler', 'crawlerTestId', 'status', 'impact', 'responsibility',
      'createdAt', 'updatedAt'
    ]);

    // 13. Teams
    const teams = await prisma.team.findMany();
    await exportTable('teams', teams, [
      'id', 'name', 'description', 'createdAt', 'updatedAt'
    ]);

    // 14. Client Projects
    const clientProjects = await prisma.clientProject.findMany();
    await exportTable('client_projects', clientProjects, [
      'id', 'opdrachtgeverId', 'projectId'
    ]);

    const technicalIssues = await prisma.technicalIssue.findMany();
    await exportTable('technical_issues', technicalIssues, [
      'id', 'title', 'description', 'request', 'wcagCriterionId', 'impact',
      'supplier', 'status', 'githubIssueUrl', 'createdAt', 'updatedAt'
    ]);

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
