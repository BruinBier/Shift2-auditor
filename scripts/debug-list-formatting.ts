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

// Find "Volledige steekproef" heading
const steekproefIndex = xmlContent.indexOf('Volledige steekproef');
if (steekproefIndex === -1) {
  console.log('Heading not found');
  process.exit(1);
}

// Get content after heading (next 2000 chars)
const afterHeading = xmlContent.substring(steekproefIndex, steekproefIndex + 2000);

// Find the first list item paragraph
const firstItemMatch = afterHeading.match(/<w:p[^>]*>.*?<w:numPr>.*?<\/w:p>/s);

if (firstItemMatch) {
  console.log('First list item paragraph:');
  console.log(firstItemMatch[0]);

  // Extract numPr section
  const numPrMatch = firstItemMatch[0].match(/<w:numPr>[\s\S]*?<\/w:numPr>/);
  if (numPrMatch) {
    console.log('\n--- List numbering properties ---');
    console.log(numPrMatch[0]);
  }
} else {
  console.log('No list item found');
}