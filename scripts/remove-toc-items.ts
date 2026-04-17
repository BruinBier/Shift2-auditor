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

// Remove items by finding and removing complete paragraphs
let updatedTocBlock = tocBlock;
let removedCount = 0;

// Remove "Toegankelijkheidsonderzoek formulieren Wierden" entry
// Look for paragraph containing this text
const wierdenPattern = /<w:p[^>]*>.*?Toegankelijkheidsonderzoek formulieren Wierden.*?<\/w:p>/s;
if (wierdenPattern.test(updatedTocBlock)) {
  updatedTocBlock = updatedTocBlock.replace(wierdenPattern, '');
  console.log('✓ Removed "Toegankelijkheidsonderzoek formulieren Wierden" from TOC');
  removedCount++;
} else {
  console.log('⚠ Could not find "Toegankelijkheidsonderzoek formulieren Wierden" entry');
}

// Remove "Inhoud" heading (but keep the TOC structure)
// We need to remove the <w:p> with "Inhoud" that has pStyle="Kop2"
const inhoudPattern = /<w:p[^>]*>.*?<w:pStyle w:val="Kop2".*?>.*?<w:t>Inhoud<\/w:t>.*?<\/w:p>/s;
if (inhoudPattern.test(updatedTocBlock)) {
  updatedTocBlock = updatedTocBlock.replace(inhoudPattern, '');
  console.log('✓ Removed "Inhoud" heading from TOC');
  removedCount++;
} else {
  console.log('⚠ Could not find "Inhoud" heading');
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
  console.log('\nPlease close Word completely and reopen the template.');
  console.log('Then right-click the TOC and select "Update Field" to refresh it.');
} else {
  console.log('\n⚠ No items were removed');
}