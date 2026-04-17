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

console.log('=== Removing empty paragraphs before "Reikwijdte en werkwijze" ===\n');

// Find the heading
const headingText = 'Reikwijdte en werkwijze';
const headingPos = xml.indexOf(headingText);

if (headingPos === -1) {
  console.log('ERROR: Heading not found');
  process.exit(1);
}

console.log('Found heading at position:', headingPos);

// Find the paragraph containing this heading
const headingPStart = Math.max(
  xml.lastIndexOf('<w:p ', headingPos),
  xml.lastIndexOf('<w:p>', headingPos)
);

console.log('Heading paragraph starts at:', headingPStart);

// Get text before heading (2000 chars should be enough)
const beforeText = xml.substring(Math.max(0, headingPStart - 3000), headingPStart);

// Find all paragraphs in this section
const paragraphMatches = beforeText.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

if (!paragraphMatches) {
  console.log('No paragraphs found before heading');
  process.exit(0);
}

console.log(`\nFound ${paragraphMatches.length} paragraphs before heading`);

// Check each paragraph from the end, remove empty ones
let removedCount = 0;
for (let i = paragraphMatches.length - 1; i >= 0; i--) {
  const paragraph = paragraphMatches[i];

  // Check if it's empty (no text content or only whitespace)
  const hasText = paragraph.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
  const textContent = hasText ? hasText[1].trim() : '';

  if (!textContent || textContent === '') {
    console.log(`\nParagraph ${i + 1} is empty, removing...`);
    console.log('Preview:', paragraph.substring(0, 150));

    // Find this exact paragraph in the XML and remove it
    const paragraphIndex = xml.indexOf(paragraph, headingPStart - 3000);
    if (paragraphIndex !== -1 && paragraphIndex < headingPStart) {
      xml = xml.substring(0, paragraphIndex) + xml.substring(paragraphIndex + paragraph.length);

      // Adjust headingPStart since we removed text before it
      headingPStart -= paragraph.length;
      removedCount++;
    }
  } else {
    // Stop when we hit a non-empty paragraph
    console.log(`\nParagraph ${i + 1} has content, stopping here`);
    console.log('Content:', textContent.substring(0, 100));
    break;
  }
}

if (removedCount > 0) {
  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log(`\n✓ Removed ${removedCount} empty paragraph(s)`);
} else {
  console.log('\n✓ No empty paragraphs to remove');
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');