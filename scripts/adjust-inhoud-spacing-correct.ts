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

console.log('=== Adjusting "Inhoud" Kop2 spacing ===\n');

// Find the exact "Inhoud" paragraph
const inhoudPattern = /<w:p w14:paraId="512C4D66"[^>]*>.*?<w:pPr><w:pStyle w:val="Kop2"\/><\/w:pPr>.*?<w:t>Inhoud<\/w:t>.*?<\/w:p>/s;
const inhoudMatch = xml.match(inhoudPattern);

if (!inhoudMatch) {
  console.log('ERROR: Could not find "Inhoud" Kop2 paragraph');
  process.exit(1);
}

const oldParagraph = inhoudMatch[0];
console.log('Found "Inhoud" paragraph');
console.log('Old:', oldParagraph.substring(0, 200));

// Add spacing: small gap after (120 twips = ~6pt)
const newParagraph = oldParagraph.replace(
  /<w:pPr><w:pStyle w:val="Kop2"\/><\/w:pPr>/,
  '<w:pPr><w:pStyle w:val="Kop2"/><w:spacing w:after="120"/></w:pPr>'
);

console.log('\nNew:', newParagraph.substring(0, 250));

// Replace in XML
xml = xml.replace(oldParagraph, newParagraph);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Spacing adjusted for "Inhoud" heading');
console.log('  Spacing after: 120 twips (~6pt)');
console.log('  This reduces the gap between "Inhoud" and the TOC entries');