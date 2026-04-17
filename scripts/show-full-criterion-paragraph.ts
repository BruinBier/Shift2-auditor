import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find the 1.3.3 criterion
const criterionText = '1.3.3 Zintuiglijke eigenschappen';
const pos = xml.indexOf(criterionText);

if (pos === -1) {
  console.error('Criterion not found!');
  process.exit(1);
}

console.log('Found criterion at position:', pos);

// Find the full paragraph
const pStart = xml.lastIndexOf('<w:p', pos);
const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;

const paragraph = xml.substring(pStart, pEnd);

console.log('\n=== Full paragraph XML ===');
console.log(paragraph);
console.log('\n=== Length:', paragraph.length, 'chars ===');

// Check for style
const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
console.log('\nStyle found:', styleMatch ? styleMatch[1] : 'NONE');