import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-report-v2.docx'
);

console.log('Reading generated document...');
const content = fs.readFileSync(docPath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Find "Buiten scope" heading
const buitenScopeIndex = xmlContent.indexOf('>Buiten scope<');
if (buitenScopeIndex !== -1) {
  console.log('Found "Buiten scope" at index:', buitenScopeIndex);

  // Check what's BEFORE it
  console.log('\n--- 500 chars BEFORE "Buiten scope" ---');
  console.log(xmlContent.substring(buitenScopeIndex - 500, buitenScopeIndex));

  // Check what's AFTER it
  console.log('\n--- 1000 chars AFTER "Buiten scope" ---');
  console.log(xmlContent.substring(buitenScopeIndex, buitenScopeIndex + 1000));

  // Check if it's a heading
  const before = xmlContent.substring(Math.max(0, buitenScopeIndex - 300), buitenScopeIndex);
  if (before.includes('pStyle w:val="Kop')) {
    console.log('\n✓ This is a heading (Kop style)');
  } else {
    console.log('\n✗ This is NOT a heading');
  }
}