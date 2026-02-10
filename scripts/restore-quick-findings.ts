import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(content: string) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (doesn't handle commas in quoted fields perfectly, but should work for our data)
    const values = line.split(',').map(v => {
      v = v.trim();
      // Remove quotes if present
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      // Handle NULL values
      if (v === '\\N' || v === 'NULL' || v === '') {
        return null;
      }
      return v;
    });

    const record: any = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }

  return records;
}

async function restoreQuickFindings() {
  try {
    const backupPath = path.join(process.cwd(), 'backups', 'backup-2026-02-10-09-16-08', 'quick_findings.csv');

    console.log('Reading backup file...');
    const csvContent = fs.readFileSync(backupPath, 'utf-8');

    console.log('Parsing CSV...');
    const records = parseCSV(csvContent);

    console.log(`Found ${records.length} quick findings to restore`);

    // Clear existing quick findings
    console.log('Clearing existing quick findings...');
    await prisma.$executeRaw`DELETE FROM quick_findings`;

    // Insert each record
    console.log('Restoring quick findings...');
    let count = 0;
    for (const record of records) {
      try {
        await prisma.quickFinding.create({
          data: {
            id: record.id,
            title: record.title,
            description: record.description,
            advice: record.advice,
            criterionCode: record.criterion_code,
            keywords: record.keywords || null,
            crawler: record.crawler === 'true' || record.crawler === 't' || record.crawler === '1',
            crawlerTestId: record.crawler_test_id || null,
            status: record.status as any || null,
            impact: record.impact as any || null,
            responsibility: record.responsibility as any || null,
            createdAt: record.created_at ? new Date(record.created_at) : new Date(),
            updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
          }
        });
        count++;
        if (count % 5 === 0) {
          console.log(`  Restored ${count}/${records.length}...`);
        }
      } catch (err) {
        console.error(`Error restoring record ${record.id}:`, err);
      }
    }

    console.log('✅ Quick findings restored successfully!');
    console.log(`Total restored: ${count}/${records.length}`);
  } catch (error) {
    console.error('Error restoring quick findings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreQuickFindings();