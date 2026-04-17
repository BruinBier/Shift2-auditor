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

console.log('=== Removing empty self-closing paragraph before "Reikwijdte en werkwijze" ===\n');

// Find the heading
const headingText = 'Reikwijdte en werkwijze';
const headingPos = xml.indexOf(headingText);

console.log('Heading position:', headingPos);

// Find the paragraph containing this heading
const headingPStart = Math.max(
  xml.lastIndexOf('<w:p ', headingPos),
  xml.lastIndexOf('<w:p>', headingPos)
);

console.log('Heading paragraph starts at:', headingPStart);

// Look for self-closing empty paragraphs just before the heading
// Pattern: <w:p ... /> (self-closing, no content)
const beforeHeading = xml.substring(Math.max(0, headingPStart - 500), headingPStart);

// Find all self-closing paragraph tags
const selfClosingMatches = beforeHeading.match(/<w:p[^>]*\/>/g);

if (selfClosingMatches && selfClosingMatches.length > 0) {
  console.log(`\nFound ${selfClosingMatches.length} self-closing paragraph(s) before heading:`);

  selfClosingMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.substring(0, 100)}...`);
  });

  // Remove the last self-closing paragraph (the one immediately before heading)
  const lastSelfClosing = selfClosingMatches[selfClosingMatches.length - 1];
  const lastPos = beforeHeading.lastIndexOf(lastSelfClosing);
  const absolutePos = Math.max(0, headingPStart - 500) + lastPos;

  console.log('\nRemoving the last one at absolute position:', absolutePos);

  // Remove it
  xml = xml.substring(0, absolutePos) + xml.substring(absolutePos + lastSelfClosing.length);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Empty paragraph removed');
} else {
  console.log('\nNo self-closing paragraphs found before heading');
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');