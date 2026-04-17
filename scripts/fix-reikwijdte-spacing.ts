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

console.log('=== Checking spacing for "Reikwijdte en werkwijze" ===\n');

// Find the heading
const headingText = 'Reikwijdte en werkwijze';
const headingPos = xml.indexOf(headingText);

if (headingPos === -1) {
  console.log('ERROR: Heading not found');
  process.exit(1);
}

// Find the paragraph containing this heading
const headingPStart = Math.max(
  xml.lastIndexOf('<w:p ', headingPos),
  xml.lastIndexOf('<w:p>', headingPos)
);
const headingPEnd = xml.indexOf('</w:p>', headingPos) + '</w:p>'.length;

const headingParagraph = xml.substring(headingPStart, headingPEnd);

console.log('Current heading paragraph:');
console.log(headingParagraph);

// Check for spacing attributes
const spacingMatch = headingParagraph.match(/<w:spacing[^>]*>/);
console.log('\nCurrent spacing:', spacingMatch ? spacingMatch[0] : '(none)');

// Remove any w:spacing with w:before attribute from the pPr section
let updatedParagraph = headingParagraph;

// Remove spacing before
updatedParagraph = updatedParagraph.replace(/<w:spacing[^>]*w:before="[^"]*"[^>]*>/g, (match) => {
  console.log('\nRemoving spacing:', match);
  // Keep spacing but remove w:before attribute
  return match.replace(/w:before="[^"]*"\s*/g, '');
});

// If spacing tag is now empty or only has w:after, we can simplify or remove
updatedParagraph = updatedParagraph.replace(/<w:spacing\s*\/>/g, '');
updatedParagraph = updatedParagraph.replace(/<w:spacing>\s*<\/w:spacing>/g, '');

if (updatedParagraph !== headingParagraph) {
  console.log('\nUpdated paragraph:');
  console.log(updatedParagraph);

  // Replace in XML
  xml = xml.substring(0, headingPStart) + updatedParagraph + xml.substring(headingPEnd);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Spacing adjusted');
} else {
  console.log('\n✓ No spacing changes needed');
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');