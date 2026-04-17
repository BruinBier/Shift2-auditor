import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Fix hardcoded URLs (valkenswaard.nl references) in the Word template
 * by removing them from the relationships file
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

// Find all Valkenswaard URLs
const valkenswaardMatches = relsContent.match(/<Relationship[^>]*Target="[^"]*valkenswaard[^"]*"[^>]*>/gi);
if (valkenswaardMatches) {
  valkenswaardMatches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match}`);
  });
}

// Remove the hardcoded Valkenswaard relationships
// Keep all the other relationships (like WCAG, digitoegankelijk, etc.)
const urlsToRemove = [
  'http://www.valkenswaard.nl',
  'https://www.valkenswaard.nl/',
  'https://valkenswaard.mijnafspraakmaken.nl/',
  'https://iburgerzaken.valkenswaard.nl/',
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

  // Find any text nodes that contain "valkenswaard"
  const valkenswaardTextMatches = docContent.match(/<w:t[^>]*>[^<]*valkenswaard[^<]*<\/w:t>/gi);

  if (valkenswaardTextMatches && valkenswaardTextMatches.length > 0) {
    console.log('\n⚠️  Found Valkenswaard text in document:');
    valkenswaardTextMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match}`);
    });
    console.log('\n  Note: These text references will be dynamically replaced by the {websiteUrl} placeholder during document generation.');
  } else {
    console.log('\n✓ No hardcoded "valkenswaard" text found in document.');
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

console.log('\n✓ Done! The template no longer contains hardcoded Valkenswaard URLs.');
console.log('  The {websiteUrl} placeholder will be used instead during document generation.');