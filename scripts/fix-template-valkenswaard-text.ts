import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Remove hardcoded Valkenswaard text references from the Word template document
 */

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Loading template:', templatePath);

// Load the template
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Get the document.xml file
const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('Could not find word/document.xml');
  process.exit(1);
}

let docContent = documentXml.asText();

console.log('\n=== BEFORE ===');
// Find any text nodes that contain "valkenswaard"
const valkenswaardTextMatches = docContent.match(/<w:t[^>]*>[^<]*valkenswaard[^<]*<\/w:t>/gi);

if (valkenswaardTextMatches && valkenswaardTextMatches.length > 0) {
  console.log('Found Valkenswaard text in document:');
  valkenswaardTextMatches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match}`);
  });
} else {
  console.log('No Valkenswaard text found in document.');
}

// Remove specific Valkenswaard URLs from the document
// These are the URLs that appear as plain text (not hyperlinks)
const urlsToRemove = [
  'https://valkenswaard.mijnafspraakmaken.nl/',
  'https://iburgerzaken.valkenswaard.nl/',
];

urlsToRemove.forEach(url => {
  // Find and remove the entire paragraph containing this URL
  // The pattern is: <w:p>...<w:t>URL</w:t>...</w:p>

  // First, find the paragraph that contains this URL
  const urlIndex = docContent.indexOf(`<w:t>${url}</w:t>`);

  if (urlIndex !== -1) {
    // Find the start of the paragraph
    const paragraphStart = docContent.lastIndexOf('<w:p ', urlIndex);
    const paragraphStart2 = docContent.lastIndexOf('<w:p>', urlIndex);
    const actualParagraphStart = Math.max(paragraphStart, paragraphStart2);

    // Find the end of the paragraph
    const paragraphEnd = docContent.indexOf('</w:p>', urlIndex) + '</w:p>'.length;

    if (actualParagraphStart !== -1 && paragraphEnd > actualParagraphStart) {
      const paragraphToRemove = docContent.substring(actualParagraphStart, paragraphEnd);

      console.log(`\n✓ Removing paragraph containing: ${url}`);
      console.log(`  Paragraph length: ${paragraphToRemove.length} characters`);

      // Remove the paragraph
      docContent = docContent.substring(0, actualParagraphStart) + docContent.substring(paragraphEnd);
    }
  } else {
    console.log(`✗ Could not find URL in document: ${url}`);
  }
});

// Update the document.xml file
zip.file('word/document.xml', docContent);

console.log('\n=== AFTER ===');
// Check again for any remaining Valkenswaard text
const remainingMatches = docContent.match(/<w:t[^>]*>[^<]*valkenswaard[^<]*<\/w:t>/gi);

if (remainingMatches && remainingMatches.length > 0) {
  console.log('⚠️  Still found Valkenswaard text:');
  remainingMatches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match}`);
  });
} else {
  console.log('✓ No Valkenswaard text found in document.');
}

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('\n✓ Created backup:', path.basename(backupPath));

// Save the fixed template
const fixedBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, fixedBuffer);
console.log('✓ Fixed template saved:', path.basename(templatePath));

console.log('\n✓ Done! Removed Valkenswaard text from the template.');