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

// Find the 1.3.3 criterion paragraph
const criterionText = '1.3.3 Zintuiglijke eigenschappen';
const pos = xml.indexOf(criterionText);

if (pos === -1) {
  console.error('Criterion not found!');
  process.exit(1);
}

console.log('Found criterion at position:', pos);

// Find the start and end of this paragraph
const pStart = xml.lastIndexOf('<w:p', pos);
const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;

const oldParagraph = xml.substring(pStart, pEnd);
console.log('\nOld paragraph:', oldParagraph.substring(0, 300));

// Check current style
const currentStyleMatch = oldParagraph.match(/pStyle w:val="([^"]+)"/);
console.log('Current style:', currentStyleMatch ? currentStyleMatch[1] : '(none)');

// Replace the paragraph with Kop3 style
// The paragraph currently has: <w:pPr><w:rPr>...
// We need: <w:pPr><w:pStyle w:val="Kop3"/>...

let newParagraph = oldParagraph;

// If there's already a pStyle, replace it
if (currentStyleMatch) {
  newParagraph = newParagraph.replace(/pStyle w:val="[^"]+"/, 'pStyle w:val="Kop3"');
} else {
  // Add pStyle as first child of pPr
  newParagraph = newParagraph.replace(/<w:pPr>/, '<w:pPr><w:pStyle w:val="Kop3"/>');
}

console.log('\nNew paragraph:', newParagraph.substring(0, 300));

// Replace in XML
xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template updated successfully');
console.log('✓ Applied Kop3 style to "1.3.3 Zintuiglijke eigenschappen A"');