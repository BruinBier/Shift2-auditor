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

console.log('=== Removing empty line before "Reikwijdte en werkwijze" ===\n');

// Find the heading
const headingText = 'Reikwijdte en werkwijze';
const headingPos = xml.indexOf(headingText);

if (headingPos === -1) {
  console.log('ERROR: Heading not found');
  process.exit(1);
}

console.log('Found heading at position:', headingPos);

// Find the paragraph containing this heading
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', headingPos),
  xml.lastIndexOf('<w:p>', headingPos)
);

console.log('Heading paragraph starts at:', pStart);

// Look for the paragraph before this heading
// Get the content before the heading paragraph (look back 2000 chars)
const beforeHeading = xml.substring(Math.max(0, pStart - 2000), pStart);

// Find the last paragraph before the heading
const lastPEnd = beforeHeading.lastIndexOf('</w:p>');
if (lastPEnd === -1) {
  console.log('No paragraph found before heading');
  process.exit(0);
}

const absoluteLastPEnd = Math.max(0, pStart - 2000) + lastPEnd + '</w:p>'.length;

// Find the start of that paragraph
let lastPStart = -1;
let searchPos = absoluteLastPEnd - 1;
while (searchPos > Math.max(0, pStart - 2000)) {
  const pStart1 = xml.lastIndexOf('<w:p ', searchPos);
  const pStart2 = xml.lastIndexOf('<w:p>', searchPos);
  const foundStart = Math.max(pStart1, pStart2);

  if (foundStart < Math.max(0, pStart - 2000)) break;

  // Check if this is before our target end position
  if (foundStart < absoluteLastPEnd - 10) {
    lastPStart = foundStart;
    break;
  }

  searchPos = foundStart - 1;
}

if (lastPStart === -1) {
  console.log('Could not find start of paragraph before heading');
  process.exit(0);
}

const lastParagraph = xml.substring(lastPStart, absoluteLastPEnd);
console.log('\nParagraph before heading:');
console.log(lastParagraph.substring(0, 300));

// Check if it's empty (no text content)
const hasText = lastParagraph.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
const textContent = hasText ? hasText[1].trim() : '';

console.log('\nText content:', textContent || '(empty)');

if (!textContent || textContent === '') {
  console.log('\nRemoving empty paragraph...');

  // Remove the empty paragraph
  xml = xml.substring(0, lastPStart) + xml.substring(absoluteLastPEnd);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Empty paragraph removed');
} else {
  console.log('\nParagraph is not empty, not removing');
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');