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

console.log('=== Removing unwanted TOC items ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;

if (sdtStart === -1 || sdtEnd <= sdtStart) {
  console.log('ERROR: TOC SDT not found');
  process.exit(1);
}

const tocBlock = xml.substring(sdtStart, sdtEnd);
const beforeToc = xml.substring(0, sdtStart);
const afterToc = xml.substring(sdtEnd);

console.log('Found TOC block');

let updatedTocBlock = tocBlock;
let removedCount = 0;

// Remove the title entry "Toegankelijkheidsonderzoek formulieren {opdrachtgeverNaam}"
// This appears as the first entry after the TOC field definition
const titlePattern = /<w:p[^>]*>.*?Toegankelijkheidsonderzoek formulieren.*?<\/w:p>/s;
if (titlePattern.test(updatedTocBlock)) {
  updatedTocBlock = updatedTocBlock.replace(titlePattern, '');
  console.log('✓ Removed "Toegankelijkheidsonderzoek formulieren" title entry from TOC');
  removedCount++;
} else {
  console.log('⚠ Could not find "Toegankelijkheidsonderzoek formulieren" entry');
}

// Remove "Inhoud" entry (the TOC entry that points to itself)
// Look for the paragraph with "Inhoud" and PAGEREF
const inhoudEntryPattern = /<w:p[^>]*>.*?<w:t>Inhoud<\/w:t>.*?PAGEREF.*?<\/w:p>/s;
if (inhoudEntryPattern.test(updatedTocBlock)) {
  updatedTocBlock = updatedTocBlock.replace(inhoudEntryPattern, '');
  console.log('✓ Removed "Inhoud" entry from TOC');
  removedCount++;
} else {
  console.log('⚠ Could not find "Inhoud" entry');
}

if (removedCount > 0) {
  // Reconstruct the XML
  xml = beforeToc + updatedTocBlock + afterToc;

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log(`\n✓ Successfully removed ${removedCount} item(s) from TOC`);
  console.log('\nPlease open the template in Word and:');
  console.log('1. Right-click the TOC');
  console.log('2. Select "Update Field"');
  console.log('3. Choose "Update entire table"');
  console.log('\nThis will regenerate the TOC without the removed items.');
} else {
  console.log('\n⚠ No items were removed');
}