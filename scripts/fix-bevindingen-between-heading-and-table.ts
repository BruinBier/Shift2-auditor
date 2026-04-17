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

console.log('=== Changing Bevindingen (position 18603) to Kop2 ===\n');

// Find the Bevindingen at position 18603
const bevPos = 18603;

// Get paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', bevPos),
  xml.lastIndexOf('<w:p>', bevPos)
);
const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;

const oldParagraph = xml.substring(pStart, pEnd);

console.log('Old paragraph (first 300 chars):');
console.log(oldParagraph.substring(0, 300));

const styleMatch = oldParagraph.match(/pStyle w:val="([^"]+)"/);
console.log('\nCurrent style:', styleMatch ? styleMatch[1] : '(no style)');

// Replace Inhopg2 with Kop2
let newParagraph = oldParagraph.replace(/pStyle w:val="Inhopg2"/, 'pStyle w:val="Kop2"');

console.log('\n✓ Changing Inhopg2 → Kop2');

// Replace in XML
xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\nThe "Bevindingen" text between "Onderzoek scores" heading and the table');
console.log('now has Kop2 style (was Inhopg2)');