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

// Find all paragraphs with "Resultaten per succecriterium"
let pos = 0;
let found = false;

while ((pos = xml.indexOf('Resultaten per succecriterium', pos)) !== -1) {
  // Find the paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Check if it's a Kop3 heading (not TOC)
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '';

  if (style === 'Kop3') {
    console.log('Found Kop3 heading at position:', pStart);
    console.log('Current paragraph (first 400 chars):');
    console.log(paragraph.substring(0, 400));

    // Check current spacing
    const hasSpacing = paragraph.includes('<w:spacing');
    const spacingMatch = paragraph.match(/<w:spacing[^>]*w:after="(\d+)"/);

    if (spacingMatch) {
      console.log(`\nCurrent spacing after: ${spacingMatch[1]} twips`);
    } else {
      console.log('\nNo explicit spacing after (using default)');
    }

    // New spacing: 360 twips = ~18pt (increased from default ~12pt)
    const newSpacing = 360;
    let updatedParagraph = paragraph;

    if (hasSpacing) {
      // Update existing spacing
      updatedParagraph = paragraph.replace(
        /<w:spacing[^>]*\/>/,
        `<w:spacing w:after="${newSpacing}"/>`
      );
    } else {
      // Add spacing to pPr
      if (paragraph.includes('<w:pPr>')) {
        updatedParagraph = paragraph.replace(
          /(<w:pPr>)/,
          `$1<w:spacing w:after="${newSpacing}"/>`
        );
      }
    }

    // Replace in XML
    xml = xml.substring(0, pStart) + updatedParagraph + xml.substring(pEnd);

    console.log(`\n✓ Updated spacing after to: ${newSpacing} twips (~${Math.round(newSpacing / 20)} pt)`);
    found = true;
    break;
  }

  pos++;
}

if (found) {
  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Template updated successfully');
  console.log('  The spacing below "Resultaten per succecriterium" has been increased');
} else {
  console.log('\nERROR: Kop3 heading not found');
}