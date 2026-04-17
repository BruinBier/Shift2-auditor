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

console.log('=== Changing "Inhoud" to Kop2 style ===\n');

// Find "Inhoud" text
const inhoudPos = xml.indexOf('>Inhoud<');

if (inhoudPos === -1) {
  console.log('ERROR: "Inhoud" text not found');
  process.exit(1);
}

console.log('Found "Inhoud" at position:', inhoudPos);

// Find the paragraph containing "Inhoud"
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', inhoudPos),
  xml.lastIndexOf('<w:p>', inhoudPos)
);
const pEnd = xml.indexOf('</w:p>', inhoudPos) + '</w:p>'.length;

const paragraph = xml.substring(pStart, pEnd);
console.log('\nCurrent paragraph preview:', paragraph.substring(0, 200));

// Check current style
const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
const currentStyle = styleMatch ? styleMatch[1] : '(no style)';
console.log('Current style:', currentStyle);

// Replace the style with Kop2
let updatedParagraph = paragraph;

if (styleMatch) {
  // Replace existing style
  updatedParagraph = paragraph.replace(/pStyle w:val="[^"]+"/g, 'pStyle w:val="Kop2"');
} else {
  // Add style if not present
  updatedParagraph = paragraph.replace(/<w:pPr>/, '<w:pPr><w:pStyle w:val="Kop2"/>');
  // If no pPr at all, add it after opening w:p tag
  if (!updatedParagraph.includes('<w:pPr>')) {
    updatedParagraph = paragraph.replace(/(<w:p[^>]*>)/, '$1<w:pPr><w:pStyle w:val="Kop2"/></w:pPr>');
  }
}

// Replace in XML
xml = xml.substring(0, pStart) + updatedParagraph + xml.substring(pEnd);

console.log('\nUpdated to Kop2');

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ "Inhoud" heading updated to Kop2');
console.log('\nPlease close Word completely and reopen the template to see the changes.');