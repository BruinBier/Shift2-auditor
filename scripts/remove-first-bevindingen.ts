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

console.log('=== Removing first (early) Bevindingen ===\n');

// Find the first Bevindingen
const firstPos = xml.indexOf('Bevindingen');
console.log('First Bevindingen at position:', firstPos);

// Find the paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', firstPos),
  xml.lastIndexOf('<w:p>', firstPos)
);
const pEnd = xml.indexOf('</w:p>', firstPos) + '</w:p>'.length;

// Remove it
xml = xml.substring(0, pStart) + xml.substring(pEnd);

console.log('✓ Removed first Bevindingen');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\nRemaining Bevindingen headings:');
console.log('  1. After Onderzoek scores table (Kop2)');
console.log('  2. Later in document (Kop2)');