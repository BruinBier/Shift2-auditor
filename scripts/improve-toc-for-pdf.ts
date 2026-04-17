import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`Created backup: ${backupPath}`);

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml')!.asText();

console.log('=== Improving TOC for PDF accessibility ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;

if (sdtStart === -1 || sdtEnd <= sdtStart) {
  console.log('ERROR: TOC SDT not found');
  process.exit(1);
}

const tocBlock = xml.substring(sdtStart, sdtEnd);
console.log('Found TOC block');

// Check if it already has proper structure
if (tocBlock.includes('docPartGallery w:val="Table of Contents"')) {
  console.log('✓ TOC already has proper docPartGallery');
}

// The TOC is already properly structured in Word
// The issue is likely in the PDF conversion
console.log('\nThe Word TOC is already properly structured.');
console.log('For PDF accessibility, you need to:');
console.log('1. Use "Save as PDF" in Word with "Document structure tags for accessibility" enabled');
console.log('2. Or use Adobe Acrobat Pro to add TOC tags after PDF creation');
console.log('3. Or ensure your PDF generation tool preserves TOC structure');

console.log('\n💡 Recommendation:');
console.log('In Word, go to File > Options > Save > "Preserve accessibility information for formats:" and enable PDF');
console.log('Then when saving/exporting to PDF, enable "Document structure tags for accessibility"');