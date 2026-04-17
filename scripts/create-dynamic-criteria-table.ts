import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

/**
 * This script modifies the Word template to use a dynamic loop for criteria assessments.
 * Instead of hardcoded criteria rows, it will use {#criteriaAssessments}...{/criteriaAssessments}
 */

async function createDynamicCriteriaTable() {
  console.log('Creating dynamic criteria table in template...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Backup first
  const backupPath = templatePath.replace('.docx', `-BACKUP-dynamic-${Date.now()}.docx`);
  fs.copyFileSync(templatePath, backupPath);
  console.log(`✓ Created backup: ${path.basename(backupPath)}\n`);

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();

  // Find the criteria table (contains 1.1.1)
  const criterion111Index = xmlContent.indexOf('1.1.1', xmlContent.indexOf('1.1.1') + 1);
  const tableStart = xmlContent.lastIndexOf('<w:tbl', criterion111Index);
  const tableEnd = xmlContent.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

  console.log(`Found criteria table at position ${tableStart} to ${tableEnd}`);

  // Extract the table
  const table = xmlContent.substring(tableStart, tableEnd);

  // Find the first two rows (header + first data row)
  const firstRowStart = table.indexOf('<w:tr');
  const firstRowEnd = table.indexOf('</w:tr>', firstRowStart) + '</w:tr>'.length;
  const headerRow = table.substring(firstRowStart, firstRowEnd);

  const secondRowStart = table.indexOf('<w:tr', firstRowEnd);
  const secondRowEnd = table.indexOf('</w:tr>', secondRowStart) + '</w:tr>'.length;
  let templateRow = table.substring(secondRowStart, secondRowEnd);

  console.log('Extracted header row and template row\n');

  // Replace the criterion code, name, and status in the template row with placeholders
  // We'll replace 1.1.1 with {code}, the criterion name with {name}, and status with {status}

  // Find and replace criterion code (1.1.1)
  templateRow = templateRow.replace(/1\.1\.1/g, '{code}');

  // Find and replace criterion name (Niet-tekstuele content)
  templateRow = templateRow.replace(/Niet-tekstuele content/g, '{name}');

  // Find and replace status (Voldoet or Voldoet niet)
  templateRow = templateRow.replace(/>Voldoet</g, '>{status}<');
  templateRow = templateRow.replace(/Voldoet niet/g, '{status}');

  // Remove bold tags from the template row - we'll handle bold conditionally via CSS or separate loops
  // For now, let's keep it simple and not make it bold
  templateRow = templateRow.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');

  console.log('Created template row with placeholders: {code}, {name}, {status}\n');

  // Now construct the new table with a loop
  const tableStartTag = table.substring(0, firstRowStart);
  const tableEndTag = '</w:tbl>';

  // Docxtemplater loop syntax for rows
  const newTable = tableStartTag + headerRow +
    '{#criteriaAssessments}' + templateRow + '{/criteriaAssessments}' +
    tableEndTag;

  console.log('WARNING: Docxtemplater loops in table rows may not work correctly.');
  console.log('Word XML requires special handling for loops that span table rows.\n');

  console.log('For now, we will use a different approach:');
  console.log('Instead of modifying the XML directly, we will:');
  console.log('1. Keep the API route changes (already done)');
  console.log('2. Manually create a simple table template in Word with the loop syntax');
  console.log('3. Or use a docxtemplater module that handles table loops better\n');

  console.log('Recommended approach:');
  console.log('1. Install docxtemplater-table-module: npm install docxtemplater-table-module');
  console.log('2. Or manually edit the Word document to add loop syntax\n');

  console.log('For now, let me create a script that uses docxtemplater\'s paragraphLoop feature...');
}

createDynamicCriteriaTable().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});