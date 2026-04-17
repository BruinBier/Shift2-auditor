import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Load the template
const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Loading template:', templatePath);
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Read document.xml
const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found in template');
  process.exit(1);
}

let xmlContent = documentXml.asText();

console.log('\n=== Searching for "Formulieren" label ===\n');

// Find the specific instance where it says "Formulieren:" on the first page
// This is right after "Opdrachtgever:" and before the websiteUrl placeholder
const pattern = /<w:t>Formulieren<\/w:t>/g;
const matches = xmlContent.match(pattern);

if (matches) {
  console.log(`Found ${matches.length} occurrence(s) of "<w:t>Formulieren</w:t>"`);

  // We want to replace the one that's near "Opdrachtgever"
  // The order is: websiteUrl, then Opdrachtgever, then Formulieren
  const opdrachtgeverIndex = xmlContent.indexOf('Opdrachtgever:');
  const websiteUrlIndex = xmlContent.indexOf('{websiteUrl}');

  console.log('{websiteUrl} at index', websiteUrlIndex);
  console.log('Opdrachtgever: at index', opdrachtgeverIndex);

  // Find "Formulieren" after Opdrachtgever
  let formulierenIndex = xmlContent.indexOf('<w:t>Formulieren</w:t>', opdrachtgeverIndex);

  if (formulierenIndex !== -1) {
    console.log('Found "Formulieren" label at index', formulierenIndex);
    console.log('\nContext before replacement:');
    console.log(xmlContent.substring(formulierenIndex - 100, formulierenIndex + 100));

    // Replace this specific occurrence
    const before = xmlContent.substring(0, formulierenIndex);
    const after = xmlContent.substring(formulierenIndex + '<w:t>Formulieren</w:t>'.length);
    xmlContent = before + '<w:t>Website</w:t>' + after;

    console.log('\nContext after replacement:');
    const newFormulierenIndex = before.length;
    console.log(xmlContent.substring(newFormulierenIndex - 100, newFormulierenIndex + 100));

    console.log('\n✓ Replaced "Formulieren" with "Website"');
  } else {
    console.log('Could not find the specific "Formulieren" label to replace');
    process.exit(1);
  }
} else {
  console.log('No occurrences of "<w:t>Formulieren</w:t>" found');
  process.exit(1);
}

// Update the ZIP with modified document.xml
zip.file('word/document.xml', xmlContent);

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
console.log('\n=== Creating backup ===');
console.log('Backup path:', backupPath);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('✓ Backup created');

// Save the modified template
console.log('\n=== Saving modified template ===');
const modifiedBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, modifiedBuffer);
console.log('✓ Template updated successfully');

console.log('\n✓ Changed "Formulieren:" to "Website:" in Word template');