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

console.log('=== Forcing third Bevindingen to Kop2 ===\n');

// Position of third Bevindingen
const pStart = 154672;
const pEnd = 154959;

console.log('Paragraph start:', pStart);
console.log('Paragraph end:', pEnd);

const oldParagraph = xml.substring(pStart, pEnd);
console.log('\nOld paragraph:');
console.log(oldParagraph);

// Create a completely fresh Kop2 paragraph
// Remove bookmark to simplify
const newParagraph = `<w:p w14:paraId="5D94C169" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:r><w:t>Bevindingen</w:t></w:r></w:p>`;

console.log('\nNew paragraph:');
console.log(newParagraph);

// Replace
xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

console.log('\n✓ Replaced paragraph with fresh Kop2 version');

// Also add 1.3.3 example criterion with Kop3 right after
const kop3Example = `<w:p w14:paraId="CRI00001" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r><w:t>1.3.3 Zintuiglijke eigenschappen A</w:t></w:r></w:p>`;

const newPEnd = pStart + newParagraph.length;
xml = xml.substring(0, newPEnd) + kop3Example + xml.substring(newPEnd);

console.log('✓ Added 1.3.3 example with Kop3');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template saved');
console.log('\nPlease close Word completely and reopen the template to see the changes.');