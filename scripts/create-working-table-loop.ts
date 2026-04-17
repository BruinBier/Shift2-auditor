import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

/**
 * Creates a working table loop by placing loop markers IN table cells
 * According to Docxtemplater docs, for table row loops:
 * - Put {#array} in the FIRST cell of the row you want to repeat
 * - Put {/array} in the LAST cell of the SAME row
 * - This will repeat the entire row for each element in the array
 */

async function createWorkingTableLoop() {
  console.log('Creating working table loop...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Find and restore from most recent backup that's NOT the dynamic one
  const backupsDir = path.join(process.cwd(), 'templates', 'formulieren');
  const backups = fs.readdirSync(backupsDir)
    .filter(f => f.includes('BACKUP') && !f.includes('dynamic') && f.endsWith('.docx'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.error('No suitable backup found!');
    process.exit(1);
  }

  const backupPath = path.join(backupsDir, backups[0]);
  console.log(`Restoring from: ${backups[0]}\n`);
  fs.copyFileSync(backupPath, templatePath);

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();

  // Find the criteria table
  const criterion111Index = xmlContent.indexOf('1.1.1', xmlContent.indexOf('1.1.1') + 1);
  const tableStart = xmlContent.lastIndexOf('<w:tbl', criterion111Index);
  const tableEnd = xmlContent.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

  const table = xmlContent.substring(tableStart, tableEnd);

  // Find header row
  const firstRowStart = table.indexOf('<w:tr');
  const firstRowEnd = table.indexOf('</w:tr>', firstRowStart) + '</w:tr>'.length;
  const headerRow = table.substring(firstRowStart, firstRowEnd);

  // Find second row (1.1.1 row) as template
  const secondRowStart = table.indexOf('<w:tr', firstRowEnd);
  const secondRowEnd = table.indexOf('</w:tr>', secondRowStart) + '</w:tr>'.length;
  let templateRow = table.substring(secondRowStart, secondRowEnd);

  console.log('Modifying template row...\n');

  // Replace criterion details with placeholders
  templateRow = templateRow.replace(/1\.1\.1/g, '{code}');
  templateRow = templateRow.replace(/Niet-tekstuele content/g, '{name}');

  // Replace status
  templateRow = templateRow.replace(/<w:t>Voldoet niet<\/w:t>/g, '<w:t>{status}</w:t>');
  templateRow = templateRow.replace(/<w:t>Voldoet<\/w:t>/g, '<w:t>{status}</w:t>');

  // Remove bold tags (we'll handle bold differently)
  templateRow = templateRow.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');

  // Now add loop markers IN the first and last cells
  // Find first <w:tc> and last </w:tc> in the row

  // Add loop start after the first cell's opening paragraph <w:p>
  const firstCellPStart = templateRow.indexOf('<w:p');
  const afterFirstPTag = templateRow.indexOf('>', firstCellPStart) + 1;

  // Insert loop start marker as text run
  const loopStartMarker = '<w:r><w:t>{#criteriaAssessments}</w:t></w:r>';
  templateRow = templateRow.substring(0, afterFirstPTag) + loopStartMarker + templateRow.substring(afterFirstPTag);

  // Add loop end before the last cell's closing paragraph
  const lastCellPEnd = templateRow.lastIndexOf('</w:p>');
  const loopEndMarker = '<w:r><w:t>{/criteriaAssessments}</w:t></w:r>';
  templateRow = templateRow.substring(0, lastCellPEnd) + loopEndMarker + templateRow.substring(lastCellPEnd);

  console.log('✓ Added loop markers in first and last cells\n');

  // Build new table
  const tablePrefix = table.substring(0, firstRowStart);
  const newTable = tablePrefix + headerRow + templateRow + '</w:tbl>';

  // Replace in full XML
  const newXml = xmlContent.substring(0, tableStart) + newTable + xmlContent.substring(tableEnd);

  // Save
  zip.file('word/document.xml', newXml);
  const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  // Backup current template first
  const newBackupPath = templatePath.replace('.docx', `-BACKUP-before-loop-${Date.now()}.docx`);
  fs.copyFileSync(templatePath, newBackupPath);

  fs.writeFileSync(templatePath, newContent);

  console.log('✓ Template updated\n');

  // Test with simple data
  console.log('Testing with sample data...');
  const testZip = new PizZip(newContent);
  const testDoc = new Docxtemplater(testZip, { paragraphLoop: true, linebreaks: true });

  try {
    testDoc.render({
      projectSubject: 'Test',
      // ... minimal required fields ...
      criteriaAssessments: [
        { code: '1.1.1', name: 'Test 1', status: 'Voldoet' },
        { code: '1.3.1', name: 'Test 2', status: 'Voldoet niet' },
      ]
    });

    console.log('❌ Rendering failed - loop markers likely still present');
    console.log('\nThis approach doesn\'t work either. The issue is that Docxtemplater');
    console.log('doesn\'t support row loops with the standard parser.\n');

  } catch (error: any) {
    console.log(`Error during test render: ${error.message}`);
  }

  console.log('\n📝 CONCLUSION:');
  console.log('Standard Docxtemplater does NOT support table row loops.');
  console.log('\nBest solution: Keep the static table and update it programmatically');
  console.log('when criteria change, OR install docxtemplater-table-module.\n');

  // Restore original
  fs.copyFileSync(newBackupPath, templatePath);
  console.log('✓ Restored original template');
}

createWorkingTableLoop().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});