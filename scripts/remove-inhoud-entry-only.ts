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

console.log('=== Removing "Inhoud" TOC entry (keeping heading) ===\n');

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

// The TOC has:
// 1. A Kop2 "Inhoud" heading (this should STAY)
// 2. TOC entries including one for "Inhoud" (this should be REMOVED)

// We need to remove ONLY the TOC entry paragraph that has "Inhoud" AND "PAGEREF"
// The Kop2 heading does NOT have PAGEREF, so it won't match

let updatedTocBlock = tocBlock;

// Remove the "Inhoud" TOC entry (has PAGEREF but not pStyle="Kop2")
// Pattern: paragraph with "Inhoud" text AND "PAGEREF" but NOT Kop2 style
const inhoudEntryPattern = /<w:p[^>]*>(?:(?!pStyle w:val="Kop2").)*?<w:t>Inhoud<\/w:t>.*?PAGEREF.*?<\/w:p>/s;

if (inhoudEntryPattern.test(updatedTocBlock)) {
  updatedTocBlock = updatedTocBlock.replace(inhoudEntryPattern, '');
  console.log('✓ Removed "Inhoud" TOC entry (keeping the Kop2 heading)');

  // Reconstruct the XML
  xml = beforeToc + updatedTocBlock + afterToc;

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Template updated successfully');
  console.log('   - "Inhoud" Kop2 heading: KEPT');
  console.log('   - "Inhoud" TOC entry: REMOVED');
} else {
  console.log('⚠ Could not find "Inhoud" TOC entry');
  console.log('   (The Kop2 heading should still be present)');
}
