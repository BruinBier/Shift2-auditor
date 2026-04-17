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

console.log('=== Removing unwanted TOC entries (carefully) ===\n');

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

// 1. Remove the document title entry "Toegankelijkheidsonderzoek formulieren {opdrachtgeverNaam}"
//    This is a paragraph with that text + PAGEREF, but NOT with pStyle="Kop2"
const titlePattern = /<w:p[^>]*>(?:(?!<\/w:p>).)*?Toegankelijkheidsonderzoek formulieren.*?PAGEREF.*?<\/w:p>/s;
const titleMatch = updatedTocBlock.match(titlePattern);

if (titleMatch) {
  console.log('Found title entry, removing...');
  updatedTocBlock = updatedTocBlock.replace(titlePattern, '');
  removedCount++;
  console.log('✓ Removed document title entry');
} else {
  console.log('⚠ Could not find document title entry');
}

// 2. Remove the "Inhoud" TOC entry (NOT the Kop2 heading!)
//    The entry has: "Inhoud" text + "PAGEREF" + pStyle="Inhopg" (NOT Kop2)
const inhoudEntryPattern = /<w:p[^>]*>(?:(?!<\/w:p>).)*?pStyle w:val="Inhopg[^"]*"(?:(?!<\/w:p>).)*?<w:t>Inhoud<\/w:t>(?:(?!<\/w:p>).)*?PAGEREF.*?<\/w:p>/s;
const inhoudMatch = updatedTocBlock.match(inhoudEntryPattern);

if (inhoudMatch) {
  console.log('Found "Inhoud" TOC entry, removing...');
  updatedTocBlock = updatedTocBlock.replace(inhoudEntryPattern, '');
  removedCount++;
  console.log('✓ Removed "Inhoud" TOC entry');
} else {
  console.log('⚠ Could not find "Inhoud" TOC entry');
}

if (removedCount > 0) {
  // Reconstruct the XML
  xml = beforeToc + updatedTocBlock + afterToc;

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log(`\n✓ Successfully removed ${removedCount} TOC entry/entries`);
  console.log('\nResult:');
  console.log('  - "Inhoud" Kop2 heading: KEPT (visible above TOC)');
  console.log('  - "Inhoud" TOC entry: REMOVED');
  console.log('  - Document title entry: REMOVED');
  console.log('  - "Samenvatting" entry: KEPT');
} else {
  console.log('\n⚠ No entries were removed');
}