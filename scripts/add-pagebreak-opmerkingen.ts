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

console.log('=== Adding page break before "Opmerkingen" ===\n');

// Find the Opmerkingen Kop2 paragraph (paraId="159A7C57")
const paragraphPattern = /<w:p w14:paraId="159A7C57"[^>]*>.*?<\/w:p>/s;
const match = xml.match(paragraphPattern);

if (!match) {
  console.log('ERROR: Opmerkingen heading not found');
  process.exit(1);
}

const oldParagraph = match[0];
console.log('Found "Opmerkingen" heading');
console.log('Current paragraph (first 300 chars):');
console.log(oldParagraph.substring(0, 300));

// Check if page break already exists
const hasPageBreak = oldParagraph.includes('<w:pageBreakBefore/>');
console.log(`\nCurrent page break: ${hasPageBreak ? 'YES' : 'NO'}`);

if (hasPageBreak) {
  console.log('\n✓ Page break already present, no changes needed');
} else {
  // Add page break to paragraph properties
  const updatedParagraph = oldParagraph.replace(
    /<w:pPr><w:pStyle w:val="Kop2"\/>/,
    '<w:pPr><w:pageBreakBefore/><w:pStyle w:val="Kop2"/>'
  );

  // Replace in XML
  xml = xml.replace(oldParagraph, updatedParagraph);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Page break added before "Opmerkingen"');
  console.log('  The heading will now start on a new page');
}