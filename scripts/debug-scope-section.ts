import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Reading template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Search for "Scope" heading (not "In scope" or "Buiten scope")
console.log('\n--- Checking for "Scope" heading ---');
let searchPos = 0;
let scopeHeadingIndex = -1;

// Look for just "Scope" as a heading
while ((searchPos = xmlContent.indexOf('>Scope<', searchPos)) !== -1) {
  // Check if this is a heading by looking backwards
  const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);
  if (before.includes('pStyle w:val="Kop') || before.includes('pStyle w:val="Heading')) {
    console.log(`Found "Scope" heading at index ${searchPos}`);
    scopeHeadingIndex = searchPos;
    console.log('\nContext around Scope heading:');
    console.log(xmlContent.substring(searchPos - 100, searchPos + 800));
    break;
  }
  searchPos++;
}

if (scopeHeadingIndex === -1) {
  console.log('"Scope" heading not found');
}