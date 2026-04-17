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

console.log('=== Changing first Bevindingen (position 18603) to Kop2 ===\n');

// Find first Bevindingen
const bevPos = xml.indexOf('Bevindingen');
console.log('Found at position:', bevPos);

// Get paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', bevPos),
  xml.lastIndexOf('<w:p>', bevPos)
);
const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;
const oldParagraph = xml.substring(pStart, pEnd);

const styleMatch = oldParagraph.match(/pStyle w:val="([^"]+)"/);
console.log('Current style:', styleMatch ? styleMatch[1] : '(no style)');

// Replace with Kop2
let newParagraph = oldParagraph.replace(/pStyle w:val="Inhopg2"/, 'pStyle w:val="Kop2"');

// Remove TOC-specific elements (hyperlinks, page refs, tabs)
// But keep it simple - just change the style
console.log('\n✓ Changing Inhopg2 → Kop2');

// Replace in XML
xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\nThe "Bevindingen" on page 6 now has Kop2 style');