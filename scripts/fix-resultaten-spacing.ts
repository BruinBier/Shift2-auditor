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

console.log('=== Increasing spacing for "Resultaten per succecriterium" ===\n');

// Find the specific paragraph (paraId="3ADA258F")
const paragraphPattern = /<w:p w14:paraId="3ADA258F"[^>]*>.*?<\/w:p>/s;
const match = xml.match(paragraphPattern);

if (!match) {
  console.log('ERROR: Paragraph not found');
  process.exit(1);
}

const oldParagraph = match[0];
console.log('Found paragraph');
console.log('Length:', oldParagraph.length);

// Check current spacing
const spacingMatch = oldParagraph.match(/<w:spacing[^>]*w:after="(\d+)"/);
if (spacingMatch) {
  console.log(`Current spacing after: ${spacingMatch[1]} twips (${Math.round(parseInt(spacingMatch[1]) / 20)} pt)`);
} else {
  console.log('No explicit spacing after (using default)');
}

// Add spacing: 360 twips = ~18pt (increased padding-bottom)
const newSpacing = 360;
let updatedParagraph = oldParagraph;

if (oldParagraph.includes('<w:spacing')) {
  // Update existing spacing
  updatedParagraph = oldParagraph.replace(
    /<w:spacing[^>]*\/>/,
    `<w:spacing w:after="${newSpacing}"/>`
  );
  console.log('Updated existing spacing');
} else {
  // Add spacing to pPr
  updatedParagraph = oldParagraph.replace(
    /(<w:pPr><w:pStyle w:val="Kop3"\/>)/,
    `$1<w:spacing w:after="${newSpacing}"/>`
  );
  console.log('Added new spacing');
}

// Replace in XML
xml = xml.replace(oldParagraph, updatedParagraph);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log(`\n✓ Spacing increased to: ${newSpacing} twips (~${Math.round(newSpacing / 20)} pt)`);
console.log('  The padding-bottom of "Resultaten per succecriterium" has been increased');