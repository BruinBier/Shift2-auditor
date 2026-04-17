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

console.log('=== Restoring "Samenvatting" TOC entry ===\n');

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

// Check if "Samenvatting" entry already exists
if (tocBlock.includes('Samenvatting') && tocBlock.includes('PAGEREF')) {
  console.log('✓ "Samenvatting" entry already exists');
} else {
  console.log('Adding "Samenvatting" TOC entry...');

  // Find where to insert it - right after the "Inhoud" heading
  // Look for the first TOC entry (which should be "Over dit onderzoek" now)
  const firstEntryPattern = /<w:p[^>]*>.*?pStyle w:val="Inhopg1".*?<\/w:p>/s;
  const firstEntryMatch = tocBlock.match(firstEntryPattern);

  if (firstEntryMatch) {
    const firstEntryStart = tocBlock.indexOf(firstEntryMatch[0]);

    // Create the "Samenvatting" TOC entry
    // This should match the style of other entries (Inhopg1)
    const samenvattingEntry = '<w:p w14:paraId="7DBE0A39" w14:textId="6A6E91E9" w:rsidR="000617CE" w:rsidRDefault="00B65DDF"><w:pPr><w:pStyle w:val="Inhopg1"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9062"/></w:tabs><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr></w:pPr><w:hyperlink w:anchor="_Toc223874291" w:history="1"><w:r w:rsidRPr="000617CE"><w:rPr><w:rStyle w:val="Hyperlink"/><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:t>Samenvatting</w:t></w:r><w:r w:rsidR="00B65DDF" w:rsidRPr="000617CE"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:tab/></w:r><w:r w:rsidR="00B65DDF"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r w:rsidR="00B65DDF"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:instrText xml:space="preserve"> PAGEREF _Toc223874291 \\h </w:instrText></w:r><w:r w:rsidR="00B65DDF"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr></w:r><w:r w:rsidR="00B65DDF"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r w:rsidR="00C61608" w:rsidRPr="000617CE"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:t>3</w:t></w:r><w:r w:rsidR="00B65DDF"><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:noProof/><w:webHidden/><w:kern w:val="2"/><w:lang w:eastAsia="nl-NL"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:hyperlink></w:p>';

    // Insert before the first entry
    const updatedTocBlock = tocBlock.substring(0, firstEntryStart) + samenvattingEntry + tocBlock.substring(firstEntryStart);

    // Reconstruct the XML
    xml = beforeToc + updatedTocBlock + afterToc;

    // Update ZIP
    zip.file('word/document.xml', xml);

    // Save
    const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, buf);

    console.log('✓ Added "Samenvatting" TOC entry');
    console.log('\n✓ Template updated successfully');
  } else {
    console.log('ERROR: Could not find first TOC entry to insert before');
  }
}