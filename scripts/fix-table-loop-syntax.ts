import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

/**
 * Docxtemplater requires special syntax for table row loops.
 * The loop markers must be placed in table cells, with special tags:
 * {#criteriaAssessments}  - in a cell BEFORE the row to loop
 * {/criteriaAssessments}  - in a cell AFTER the row to loop
 *
 * We'll use a different approach: put the loop markers in the first cell of the template row
 */

async function fixTableLoopSyntax() {
  console.log('Fixing table loop syntax...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Restore from latest backup
  const backups = fs.readdirSync(path.join(process.cwd(), 'templates', 'formulieren'))
    .filter(f => f.includes('BACKUP') && f.includes('.docx'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.error('No backup found!');
    process.exit(1);
  }

  const latestBackup = path.join(process.cwd(), 'templates', 'formulieren', backups[0]);
  console.log(`Restoring from backup: ${backups[0]}`);
  fs.copyFileSync(latestBackup, templatePath);

  console.log('\n⚠ The dynamic table implementation requires a different approach.');
  console.log('\nDocxtemplater has limitations with table row loops.');
  console.log('The recommended solution is to use one of these approaches:\n');

  console.log('Option 1: Use docxtemplater-table-module');
  console.log('  npm install docxtemplater-table-module');
  console.log('  This module specifically handles table loops\n');

  console.log('Option 2: Manually create the loop in Word');
  console.log('  1. Open the template in Word');
  console.log('  2. In the first cell of the template row, add: {#criteriaAssessments}');
  console.log('  3. In the last cell of the SAME row, add: {/criteriaAssessments}');
  console.log('  4. Add placeholders in cells: {code}, {name}, {status}\n');

  console.log('Option 3: Generate table dynamically in code');
  console.log('  Instead of using template loops, generate the table XML programmatically');
  console.log('  This gives full control but is more complex\n');

  console.log('For now, I will implement Option 3 - generate the table XML programmatically.');
  console.log('This way we have full control over the table structure and formatting.\n');

  console.log('Would you like me to proceed with Option 3?');
  console.log('This will require modifying the API route to generate the table XML.');
}

fixTableLoopSyntax().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});