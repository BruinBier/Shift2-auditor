import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Remove hardcoded URLs from old projects (op-morgen, hhnk) in the Word template
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

// Get the relationships file
const relsFile = zip.file('word/_rels/document.xml.rels');
if (!relsFile) {
  console.error('Could not find word/_rels/document.xml.rels');
  process.exit(1);
}

let relsContent = relsFile.asText();
console.log('\n=== BEFORE ===');
console.log('URLs found in relationships:');

// Find all old project URLs
const oldProjectMatches = relsContent.match(/<Relationship[^>]*Target="[^"]*(?:op-morgen|hhnk)[^"]*"[^>]*>/gi);
if (oldProjectMatches) {
  oldProjectMatches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match}`);
  });
} else {
  console.log('  No old project URLs found');
}

// Remove the hardcoded old project relationships
const urlsToRemove = [
  'https://www.op-morgen.nl/',
  'https://mijn.hhnk.nl/authenticate',
];

urlsToRemove.forEach(url => {
  // Escape special characters for regex
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Remove the entire Relationship tag that contains this URL
  const regex = new RegExp(`<Relationship[^>]*Target="${escapedUrl}"[^>]*/>`, 'gi');

  const beforeLength = relsContent.length;
  relsContent = relsContent.replace(regex, '');
  const afterLength = relsContent.length;

  if (beforeLength !== afterLength) {
    console.log(`✓ Removed relationship with URL: ${url}`);
  }
});

// Update the relationships file
zip.file('word/_rels/document.xml.rels', relsContent);

console.log('\n=== AFTER ===');
console.log('Remaining relationships count:', (relsContent.match(/<Relationship /g) || []).length);

// Also check document.xml for hardcoded text that might reference these URLs
const documentXml = zip.file('word/document.xml');
if (documentXml) {
  let docContent = documentXml.asText();

  // Find any text nodes that contain old project names
  const oldProjectTextMatches = docContent.match(/<w:t[^>]*>[^<]*(?:op-morgen|hhnk)[^<]*<\/w:t>/gi);

  if (oldProjectTextMatches && oldProjectTextMatches.length > 0) {
    console.log('\n⚠️  Found old project text in document:');
    oldProjectTextMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match}`);
    });

    // Remove paragraphs containing these URLs
    urlsToRemove.forEach(url => {
      const urlIndex = docContent.indexOf(`<w:t>${url}</w:t>`);

      if (urlIndex !== -1) {
        // Find the start of the paragraph
        const paragraphStart = docContent.lastIndexOf('<w:p ', urlIndex);
        const paragraphStart2 = docContent.lastIndexOf('<w:p>', urlIndex);
        const actualParagraphStart = Math.max(paragraphStart, paragraphStart2);

        // Find the end of the paragraph
        const paragraphEnd = docContent.indexOf('</w:p>', urlIndex) + '</w:p>'.length;

        if (actualParagraphStart !== -1 && paragraphEnd > actualParagraphStart) {
          console.log(`\n✓ Removing paragraph containing: ${url}`);

          // Remove the paragraph
          docContent = docContent.substring(0, actualParagraphStart) + docContent.substring(paragraphEnd);
        }
      }
    });

    // Update the document.xml file
    zip.file('word/document.xml', docContent);
  } else {
    console.log('\n✓ No old project text found in document.');
  }
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

console.log('\n✓ Done! The template no longer contains hardcoded old project URLs.');
console.log('  Scope URLs will be dynamically generated from the project data.');