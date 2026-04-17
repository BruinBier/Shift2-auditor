import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking Table of Contents structure ===\n');

// Find "Inhoud" heading
const inhoudPos = xml.indexOf('>Inhoud<');
console.log('Found "Inhoud" at position:', inhoudPos);

// Look for TOC field markers around this position
const beforeInhoud = xml.substring(Math.max(0, inhoudPos - 3000), inhoudPos);
const afterInhoud = xml.substring(inhoudPos, Math.min(xml.length, inhoudPos + 5000));

// Check for SDT (Structured Document Tag) which is used for TOC
const hasSdt = beforeInhoud.includes('<w:sdt>') || afterInhoud.includes('<w:sdt>');
console.log('Has SDT (Structured Document Tag):', hasSdt);

// Check for TOC field
const hasTocField = afterInhoud.includes('TOC \\o') || afterInhoud.includes('docPartGallery w:val="Table of Contents"');
console.log('Has TOC field:', hasTocField);

// Check for hyperlinks (TOC entries are usually hyperlinks)
const hyperlinkCount = afterInhoud.match(/<w:hyperlink/g)?.length || 0;
console.log('Number of hyperlinks in TOC area:', hyperlinkCount);

// Find the TOC section
if (hasSdt && hasTocField) {
  console.log('\n✓ This appears to be a proper Word TOC');

  // Find the SDT block
  const sdtStart = xml.indexOf('<w:sdt>', Math.max(0, inhoudPos - 3000));
  const sdtEnd = xml.indexOf('</w:sdt>', inhoudPos) + '</w:sdt>'.length;

  if (sdtStart !== -1 && sdtEnd > sdtStart) {
    const sdtBlock = xml.substring(sdtStart, Math.min(sdtEnd, sdtStart + 2000));
    console.log('\nTOC SDT structure (first 1000 chars):');
    console.log(sdtBlock.substring(0, 1000));
  }
} else {
  console.log('\n⚠ This does NOT appear to be a proper Word TOC');
  console.log('It may just be manually formatted paragraphs');

  // Show what we have
  console.log('\nContent around "Inhoud":');
  console.log(afterInhoud.substring(0, 1000));
}