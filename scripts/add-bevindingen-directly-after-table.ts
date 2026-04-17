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

console.log('=== Adding Bevindingen Kop2 directly after Onderzoek scores table ===\n');

// Find Onderzoek scores table
const onderzoekPos = xml.indexOf('Onderzoek scores');
const tableStart = xml.indexOf('<w:tbl', onderzoekPos);
const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

console.log('Table ends at position:', tableEnd);

// Create Bevindingen Kop2 heading + 1.3.3 Kop3 heading
const newContent = `<w:p w14:paraId="5D94C168" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:r><w:t>Bevindingen</w:t></w:r></w:p><w:p w14:paraId="0C497707" w14:textId="77777777" w:rsidR="00280895" w:rsidRPr="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r><w:t>1.3.3 Zintuiglijke eigenschappen A</w:t></w:r></w:p>`;

// Insert directly after table
xml = xml.substring(0, tableEnd) + newContent + xml.substring(tableEnd);

console.log('✓ Added Bevindingen (Kop2) and 1.3.3 (Kop3) after table');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\nStructure now:');
console.log('  Onderzoek scores table');
console.log('  ↓');
console.log('  Bevindingen (Kop2)');
console.log('  1.3.3 Zintuiglijke eigenschappen A (Kop3)');