import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding "Resultaten per succecriterium" heading ===\n');

// Find the heading
const pos = xml.indexOf('Resultaten per succecriterium');

if (pos === -1) {
  console.log('ERROR: Text not found');
  process.exit(1);
}

console.log('Found at position:', pos);

// Find the paragraph containing this text
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', pos),
  xml.lastIndexOf('<w:p>', pos)
);
const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
const paragraph = xml.substring(pStart, pEnd);

console.log('\nParagraph (first 500 chars):');
console.log(paragraph.substring(0, 500));

// Check style
const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
if (styleMatch) {
  console.log(`\nStyle: ${styleMatch[1]}`);
}

// Check current spacing
const spacingMatch = paragraph.match(/<w:spacing[^>]*w:after="(\d+)"/);
if (spacingMatch) {
  console.log(`Current spacing after: ${spacingMatch[1]} twips (${Math.round(parseInt(spacingMatch[1]) / 20)} pt)`);
} else {
  console.log('No explicit spacing after found (using style default)');
}