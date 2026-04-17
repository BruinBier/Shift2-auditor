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

console.log('=== Adding page break before "Samenvatting" ===\n');

// Find "Samenvatting" heading
const samenvattingText = 'Samenvatting';
const samenvattingPos = xml.indexOf(`<w:t>${samenvattingText}</w:t>`);

if (samenvattingPos === -1) {
  console.log('ERROR: "Samenvatting" heading not found');
  process.exit(1);
}

console.log('Found "Samenvatting" at position:', samenvattingPos);

// Find the paragraph containing this heading
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', samenvattingPos),
  xml.lastIndexOf('<w:p>', samenvattingPos)
);
const pEnd = xml.indexOf('</w:p>', samenvattingPos) + '</w:p>'.length;

const paragraph = xml.substring(pStart, pEnd);

console.log('\nCurrent paragraph:');
console.log(paragraph.substring(0, 200));

// Check if page break already exists
if (paragraph.includes('<w:pageBreakBefore/>')) {
  console.log('\n✓ Page break already exists');
  process.exit(0);
}

// Add page break to the paragraph properties
let updatedParagraph = paragraph;

// If there's already a pPr section, add pageBreakBefore to it
if (paragraph.includes('<w:pPr>')) {
  updatedParagraph = paragraph.replace(
    /<w:pPr>/,
    '<w:pPr><w:pageBreakBefore/>'
  );
} else {
  // Add pPr section with pageBreakBefore after opening w:p tag
  updatedParagraph = paragraph.replace(
    /(<w:p[^>]*>)/,
    '$1<w:pPr><w:pageBreakBefore/></w:pPr>'
  );
}

console.log('\nUpdated paragraph (preview):');
console.log(updatedParagraph.substring(0, 250));

// Replace in XML
xml = xml.substring(0, pStart) + updatedParagraph + xml.substring(pEnd);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Page break added before "Samenvatting"');
console.log('\nPlease close Word completely and reopen the template to see the changes.');