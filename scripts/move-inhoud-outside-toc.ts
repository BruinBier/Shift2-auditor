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

console.log('=== Moving "Inhoud" heading OUTSIDE TOC SDT ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtContentStart = xml.indexOf('<w:sdtContent>', sdtStart);

if (sdtStart === -1 || sdtContentStart === -1) {
  console.log('ERROR: TOC SDT not found');
  process.exit(1);
}

// Find the "Inhoud" Kop2 paragraph inside sdtContent
const afterSdtContent = xml.substring(sdtContentStart);
const inhoudMatch = afterSdtContent.match(/(<w:p[^>]*>.*?<w:pStyle w:val="Kop2".*?>.*?<w:t>Inhoud<\/w:t>.*?<\/w:p>)/s);

if (!inhoudMatch) {
  console.log('ERROR: Inhoud heading not found inside TOC');
  process.exit(1);
}

const inhoudParagraph = inhoudMatch[1];
console.log('Found "Inhoud" heading inside TOC');

// Find where this paragraph is in the full XML
const inhoudStart = xml.indexOf(inhoudParagraph);
const inhoudEnd = inhoudStart + inhoudParagraph.length;

console.log('Removing "Inhoud" from inside TOC...');

// Remove it from inside the TOC
xml = xml.substring(0, inhoudStart) + xml.substring(inhoudEnd);

// Now insert it BEFORE the <w:sdt> (before the TOC starts)
const newSdtStart = xml.indexOf('<w:sdt>'); // Re-find after removal
console.log('Inserting "Inhoud" BEFORE TOC...');

xml = xml.substring(0, newSdtStart) + inhoudParagraph + xml.substring(newSdtStart);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Successfully moved "Inhoud" heading');
console.log('  - Old position: INSIDE <w:sdtContent> (hidden in Word)');
console.log('  - New position: BEFORE <w:sdt> (visible in Word)');
console.log('\nThe "Inhoud" heading should now be visible above the TOC!');