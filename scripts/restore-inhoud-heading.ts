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

console.log('=== Restoring "Inhoud" Kop2 heading ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtContentStart = xml.indexOf('<w:sdtContent>', sdtStart);

if (sdtStart === -1 || sdtContentStart === -1) {
  console.log('ERROR: TOC SDT not found');
  process.exit(1);
}

console.log('Found TOC SDT structure');

// The "Inhoud" heading should be the first paragraph inside <w:sdtContent>
// Let's check if it's already there
const afterSdtContent = xml.substring(sdtContentStart, sdtContentStart + 500);
const hasInhoudHeading = afterSdtContent.includes('Kop2') && afterSdtContent.includes('Inhoud');

if (hasInhoudHeading) {
  console.log('✓ "Inhoud" heading already exists');
} else {
  console.log('Adding "Inhoud" Kop2 heading...');

  // Create the "Inhoud" heading paragraph
  // This is a Kop2 paragraph with "Inhoud" text
  const inhoudHeading = '<w:p w14:paraId="512C4D66" w14:textId="76A0D339" w:rsidR="00B65DDF" w:rsidRDefault="00B65DDF"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:r><w:t>Inhoud</w:t></w:r><w:bookmarkEnd w:id="1"/></w:p>';

  // Insert it right after <w:sdtContent>
  const insertPosition = sdtContentStart + '<w:sdtContent>'.length;
  xml = xml.substring(0, insertPosition) + inhoudHeading + xml.substring(insertPosition);

  console.log('✓ Added "Inhoud" Kop2 heading');

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Template updated with "Inhoud" heading');
}

console.log('\nNote: The "Inhoud" heading is placed INSIDE the TOC SDT structure,');
console.log('so it appears above the TOC visually but should not create a TOC entry.');