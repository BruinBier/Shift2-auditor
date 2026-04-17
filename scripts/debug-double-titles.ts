import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-complete.docx'
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

// Find "Volledige steekproef" section
const steekproefIndex = xmlContent.indexOf('Volledige steekproef');
if (steekproefIndex === -1) {
  console.log('Section not found');
  process.exit(1);
}

// Get content after heading (next 3000 chars to see first few items)
const afterHeading = xmlContent.substring(steekproefIndex + 100, steekproefIndex + 3000);

// Find first sample item title
const firstTitleIndex = afterHeading.indexOf('Stap 1 - Reactieformulier');
if (firstTitleIndex !== -1) {
  console.log('--- First sample item area (1000 chars) ---');
  console.log(afterHeading.substring(firstTitleIndex, firstTitleIndex + 1000));
}