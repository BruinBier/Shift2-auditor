import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function debug135Row() {
  console.log('Debugging 1.3.5 row...\n');

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

  // Find 1.3.5
  let index = xmlContent.indexOf('1.3.5');

  // Skip TOC if needed
  if (index < 50000 && xmlContent.indexOf('1.3.5', index + 1) > 0) {
    index = xmlContent.indexOf('1.3.5', index + 1);
  }

  console.log(`Found 1.3.5 at position ${index}`);

  // Find the table row
  const trStart = xmlContent.lastIndexOf('<w:tr ', index);
  const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;

  const tableRow = xmlContent.substring(trStart, trEnd);

  // Write to file for inspection
  fs.writeFileSync(
    path.join(process.cwd(), '135-row-debug.txt'),
    tableRow
  );

  console.log(`\nTable row (${tableRow.length} chars) written to 135-row-debug.txt`);

  // Look for key phrases
  console.log('\nSearching for key phrases:');
  console.log(`  "Voldoet niet": ${tableRow.includes('Voldoet niet') ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  "Voldoet": ${tableRow.includes('Voldoet') ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  "<w:b/>": ${tableRow.includes('<w:b/>') ? 'FOUND' : 'NOT FOUND'}`);

  // Get a snippet around the status area (last 1000 chars which should have the status cell)
  const snippet = tableRow.substring(Math.max(0, tableRow.length - 1000));

  console.log('\n=== Last 500 chars of row (status area) ===');
  console.log(snippet.substring(snippet.length - 500));
}

debug135Row().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});