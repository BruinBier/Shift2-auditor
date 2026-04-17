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

console.log('=== Adding 1.3.3 Kop3 heading after first Bevindingen ===\n');

// Find the first Bevindingen
const firstBevPos = xml.indexOf('Bevindingen');
console.log('First Bevindingen at position:', firstBevPos);

// Find the end of this paragraph
const pEnd = xml.indexOf('</w:p>', firstBevPos) + '</w:p>'.length;
console.log('Paragraph ends at:', pEnd);

// Create the 1.3.3 criterion heading with Kop3
const criterionHeading = `<w:p w14:paraId="0C497707" w14:textId="77777777" w:rsidR="00280895" w:rsidRPr="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r><w:t>1.3.3 Zintuiglijke eigenschappen A</w:t></w:r></w:p>`;

// Insert after the Bevindingen paragraph
xml = xml.substring(0, pEnd) + criterionHeading + xml.substring(pEnd);

console.log('✓ Added 1.3.3 Zintuiglijke eigenschappen A with Kop3 style');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\nStructure on page 6 after Onderzoek scores table:');
console.log('  - Bevindingen (Kop2)');
console.log('  - 1.3.3 Zintuiglijke eigenschappen A (Kop3)');