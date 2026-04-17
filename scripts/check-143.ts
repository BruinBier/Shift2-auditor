import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function check143() {
  console.log('Checking criterion 1.4.3...\n');

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

  // Find 1.4.3 in table (not TOC)
  let index = xmlContent.indexOf('1.4.3');
  while (index !== -1 && index < 50000) {
    index = xmlContent.indexOf('1.4.3', index + 1);
  }

  if (index === -1 || index < 50000) {
    console.log('❌ 1.4.3 not found in table');
    return;
  }

  // Get row
  const trStart = xmlContent.lastIndexOf('<w:tr ', index);
  const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;
  const row = xmlContent.substring(trStart, trEnd);

  // Check status
  const hasVoldoetNiet = row.includes('Voldoet niet');
  const hasVoldoet = row.includes('>Voldoet<') || row.includes('<w:t>Voldoet</w:t>');
  const hasBold = row.includes('<w:b/>');

  const actualStatus = hasVoldoetNiet ? 'Voldoet niet' : hasVoldoet ? 'Voldoet' : 'UNKNOWN';

  console.log(`Criterion 1.4.3 - Contrast (minimum):`);
  console.log(`  Current status: ${actualStatus}`);
  console.log(`  Bold: ${hasBold ? 'YES' : 'NO'}`);
}

check143().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});