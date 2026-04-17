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

console.log('=== Changing first Bevindingen from Inhopg2 to Kop2 ===\n');

// Find the first Bevindingen (should be around position 18603)
const firstBevPos = xml.indexOf('Bevindingen');
console.log('First Bevindingen at position:', firstBevPos);

// Get the paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', firstBevPos),
  xml.lastIndexOf('<w:p>', firstBevPos)
);
const pEnd = xml.indexOf('</w:p>', firstBevPos) + '</w:p>'.length;

const oldParagraph = xml.substring(pStart, pEnd);

console.log('\nOld paragraph style:');
const styleMatch = oldParagraph.match(/pStyle w:val="([^"]+)"/);
console.log('  ', styleMatch ? styleMatch[1] : '(no style)');

// Replace Inhopg2 with Kop2
let newParagraph = oldParagraph.replace(/pStyle w:val="Inhopg2"/, 'pStyle w:val="Kop2"');

// Also remove the TOC-specific formatting (tabs, hyperlinks, pageref)
// Make it a simple Kop2 heading like the other ones
newParagraph = `<w:p w14:paraId="5D94C168" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:r><w:t>Bevindingen</w:t></w:r></w:p>`;

console.log('\nNew paragraph:');
console.log('   Simple Kop2 heading without TOC formatting');

// Replace in XML
xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

console.log('\n✓ Changed Bevindingen to Kop2');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\nThe "Bevindingen" text after the Onderzoek scores table is now a proper Kop2 heading');