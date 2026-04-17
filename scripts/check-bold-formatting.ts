import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-more-spacing.docx'
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

// Get content after heading (next 2000 chars to see first item)
const afterHeading = xmlContent.substring(steekproefIndex + 100, steekproefIndex + 2100);

// Find first sample item title
const firstTitleIndex = afterHeading.indexOf('Stap 1');
if (firstTitleIndex !== -1) {
  console.log('--- First sample item area (800 chars) ---');
  const snippet = afterHeading.substring(firstTitleIndex - 100, firstTitleIndex + 700);
  console.log(snippet);

  // Check if <w:b/> is present
  if (snippet.includes('<w:b/>')) {
    console.log('\n✓ Bold tag IS present in XML');
  } else {
    console.log('\n✗ Bold tag NOT present in XML');
  }
}