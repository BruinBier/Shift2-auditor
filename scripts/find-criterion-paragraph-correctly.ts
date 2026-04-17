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

// Find paragraph start - look for both <w:p> and <w:p ...>
const beforePos = xml.substring(0, pos);
const pWithSpace = beforePos.lastIndexOf('<w:p ');
const pWithoutSpace = beforePos.lastIndexOf('<w:p>');

const pStart = Math.max(pWithSpace, pWithoutSpace);

console.log('Paragraph starts at:', pStart);
console.log('Found with space:', pWithSpace);
console.log('Found without space:', pWithoutSpace);

// Show 200 chars before the criterion text to see opening tag
const context = xml.substring(pos - 200, pos + 100);
console.log('\n=== Context (200 chars before, 100 after) ===');
console.log(context);

// Find the closing tag
const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;

const fullParagraph = xml.substring(pStart, pEnd);
console.log('\n=== Full paragraph ===');
console.log(fullParagraph);