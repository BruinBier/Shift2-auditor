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

// Search for "Volledige steekproef" heading (Kop4)
console.log('\n--- Checking for "Volledige steekproef" heading ---');
let searchPos = 0;
let steekproefHeadingIndex = -1;

while ((searchPos = xmlContent.indexOf('Volledige steekproef', searchPos)) !== -1) {
  // Check if this is a heading by looking backwards
  const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);
  if (before.includes('pStyle w:val="Kop')) {
    console.log(`Found "Volledige steekproef" heading at index ${searchPos}`);
    steekproefHeadingIndex = searchPos;
    console.log('\nContext around heading (1500 chars):');
    console.log(xmlContent.substring(searchPos - 200, searchPos + 1300));
    break;
  }
  searchPos++;
}

if (steekproefHeadingIndex === -1) {
  console.log('"Volledige steekproef" heading not found');
}