import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Fix typo: "Raportversie" → "Rapportversie" (double-p)
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
// Find occurrences of "Raportversie"
const matches = docContent.match(/<w:t[^>]*>[^<]*Raportversie[^<]*<\/w:t>/gi);

if (matches) {
  console.log('Found typo "Raportversie":');
  matches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match}`);
  });

  // Fix the typo
  docContent = docContent.replace(/Raportversie/g, 'Rapportversie');

  console.log('\n✓ Fixed typo: "Raportversie" → "Rapportversie"');
} else {
  console.log('No typo found in document.');
}

// Update the document.xml file
zip.file('word/document.xml', docContent);

console.log('\n=== AFTER ===');
const afterMatches = docContent.match(/<w:t[^>]*>[^<]*Rapportversie[^<]*<\/w:t>/gi);
if (afterMatches) {
  console.log('Confirmed "Rapportversie" (correct):');
  afterMatches.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match}`);
  });
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

console.log('\n✓ Done! Fixed typo in Word template.');