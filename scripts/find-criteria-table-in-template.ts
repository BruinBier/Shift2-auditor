import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function findCriteriaTable() {
  console.log('Finding criteria table in template...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  const xmlContent = doc.asText();

  // Find the first occurrence of criterion code 1.1.1 (likely in TOC or table)
  let firstOccurrence = xmlContent.indexOf('1.1.1');
  console.log('First occurrence of 1.1.1 at:', firstOccurrence);

  // Find second occurrence (should be in the criteria table, not TOC)
  let secondOccurrence = xmlContent.indexOf('1.1.1', firstOccurrence + 1);
  console.log('Second occurrence of 1.1.1 at:', secondOccurrence);

  // Find the table containing the second occurrence
  const tableStart = xmlContent.lastIndexOf('<w:tbl', secondOccurrence);

  if (tableStart === -1) {
    console.log('No table found after heading');
    return;
  }

  console.log('Table starts at position:', tableStart);

  // Find table end
  const tableEnd = xmlContent.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

  console.log('Table ends at position:', tableEnd);
  console.log('Table length:', tableEnd - tableStart);

  // Extract a small sample to see structure
  const sample = xmlContent.substring(tableStart, Math.min(tableStart + 3000, tableEnd));

  // Save to file for inspection
  fs.writeFileSync(
    path.join(process.cwd(), 'table-structure.xml'),
    sample
  );

  console.log('\nSaved table structure sample to table-structure.xml');
  console.log('You can inspect this file to understand the table structure');

  // Count rows in table (count <w:tr occurrences)
  const tableContent = xmlContent.substring(tableStart, tableEnd);
  const rowCount = (tableContent.match(/<w:tr[\s>]/g) || []).length;

  console.log(`\nTable has ${rowCount} rows (including header)`);

  // Look for criteria codes in the table
  const criteriaFound = [];
  const criteriaCodes = ['1.1.1', '1.3.1', '1.3.3', '1.3.5', '1.4.1', '1.4.3', '2.4.6', '3.3.2', '4.1.2'];

  for (const code of criteriaCodes) {
    const index = tableContent.indexOf(code);
    if (index !== -1) {
      criteriaFound.push(code);
    }
  }

  console.log('\nCriteria found in table:', criteriaFound.join(', '));
}

findCriteriaTable().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});