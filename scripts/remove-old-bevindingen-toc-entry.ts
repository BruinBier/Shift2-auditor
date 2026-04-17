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

console.log('=== Removing old Bevindingen TOC entry ===\n');

// Find the first Bevindingen (position ~18603)
const pos = xml.indexOf('Bevindingen');
console.log('Found first Bevindingen at position:', pos);

// Get the paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', pos),
  xml.lastIndexOf('<w:p>', pos)
);
const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;

const paragraph = xml.substring(pStart, pEnd);

// Check if this has Inhopg2 style
if (paragraph.includes('pStyle w:val="Inhopg2"')) {
  console.log('Confirmed: This is the old TOC entry with Inhopg2 style');
  console.log('Removing this paragraph...\n');

  // Remove the paragraph
  xml = xml.substring(0, pStart) + xml.substring(pEnd);

  console.log('✓ Removed old "Bevindingen" TOC entry');

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('✓ Template updated successfully');
  console.log('\nNow only the real "Bevindingen" heading with Kop2 remains in the document.');
} else {
  console.log('ERROR: This paragraph does not have Inhopg2 style!');
  console.log('Paragraph:', paragraph.substring(0, 200));
}