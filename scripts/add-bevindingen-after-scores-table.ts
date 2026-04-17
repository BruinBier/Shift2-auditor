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

console.log('=== Adding Bevindingen Kop2 heading after Onderzoek scores table ===\n');

// Find the Onderzoek scores table
const onderzoekPos = xml.indexOf('Onderzoek scores');
const tableStart = xml.indexOf('<w:tbl', onderzoekPos);
const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

console.log('Onderzoek scores table ends at position:', tableEnd);

// Create a new Bevindingen paragraph with Kop2 style
// Based on the "Opmerkingen" structure
const newBevindingen = `<w:p w14:paraId="5D94C169" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:bookmarkStart w:id="8" w:name="_Toc223874297"/><w:r w:rsidRPr="00280895"><w:t>Bevindingen</w:t></w:r><w:bookmarkEnd w:id="8"/></w:p>`;

// Insert the new Bevindingen heading right after the table
console.log('Inserting Bevindingen Kop2 heading after the table...');

xml = xml.substring(0, tableEnd) + newBevindingen + xml.substring(tableEnd);

console.log('✓ Added Bevindingen Kop2 heading');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Template updated successfully');
console.log('\n"Bevindingen" with Kop2 style now appears directly after the Onderzoek scores table');