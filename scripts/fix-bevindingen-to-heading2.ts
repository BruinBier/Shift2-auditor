import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`Created backup: ${backupPath}`);

// Load template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml')!.asText();

// Find the Bevindingen at position ~154905 with Kop2
let pos = xml.indexOf('Bevindingen');
let bevHeadingPos = -1;

while (pos !== -1) {
  const before = xml.substring(Math.max(0, pos - 200), pos);
  if (before.includes('pStyle w:val="Kop2"')) {
    bevHeadingPos = pos;
    console.log('Found Bevindingen with Kop2 at position:', pos);
    break;
  }
  pos = xml.indexOf('Bevindingen', pos + 1);
}

if (bevHeadingPos === -1) {
  console.error('Bevindingen with Kop2 not found!');
  process.exit(1);
}

// Find the paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', bevHeadingPos),
  xml.lastIndexOf('<w:p>', bevHeadingPos)
);
const pEnd = xml.indexOf('</w:p>', bevHeadingPos) + '</w:p>'.length;

const oldParagraph = xml.substring(pStart, pEnd);
console.log('\nOld paragraph (first 300 chars):');
console.log(oldParagraph.substring(0, 300));

// Replace Kop2 with Heading2
const newParagraph = oldParagraph.replace('pStyle w:val="Kop2"', 'pStyle w:val="Heading2"');

console.log('\nNew paragraph (first 300 chars):');
console.log(newParagraph.substring(0, 300));

// Replace in XML
xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

// Also update 1.3.3 to use Heading3 instead of Kop3
const criterionPos = xml.indexOf('1.3.3 Zintuiglijke eigenschappen A');
if (criterionPos !== -1) {
  const cStart = Math.max(
    xml.lastIndexOf('<w:p ', criterionPos),
    xml.lastIndexOf('<w:p>', criterionPos)
  );
  const cEnd = xml.indexOf('</w:p>', criterionPos) + '</w:p>'.length;

  const oldCParagraph = xml.substring(cStart, cEnd);
  const newCParagraph = oldCParagraph.replace('pStyle w:val="Kop3"', 'pStyle w:val="Heading3"');

  xml = xml.substring(0, cStart) + newCParagraph + xml.substring(cEnd);

  console.log('\n✓ Also updated 1.3.3 from Kop3 to Heading3');
}

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template updated successfully');
console.log('✓ Changed Bevindingen from Kop2 to Heading2');
console.log('✓ Changed 1.3.3 from Kop3 to Heading3');