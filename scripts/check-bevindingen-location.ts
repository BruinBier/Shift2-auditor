import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking first Bevindingen (position 18603) ===\n');

const pos = 18603;

// Get 3000 chars before to see context
const before = xml.substring(pos - 3000, pos);
const after = xml.substring(pos, pos + 1000);

// Check if we're in an SDT (table of contents structure)
const inSDT = before.lastIndexOf('<w:sdt') > before.lastIndexOf('</w:sdt>');
const inTOC = before.includes('docPartGallery w:val="Table of Contents"');

console.log('In SDT (structured document tag): ', inSDT ? 'YES' : 'NO');
console.log('In TOC element:', inTOC ? 'YES' : 'NO');

// Show the context
console.log('\n=== Text content before "Bevindingen" (last 500 chars) ===');
const textsBefore = before.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
if (textsBefore) {
  const lastTexts = textsBefore.slice(-15);
  console.log(lastTexts.map(t => t.replace(/<[^>]+>/g, '')).join(' '));
}

console.log('\n=== Text content after "Bevindingen" (next 500 chars) ===');
const textsAfter = after.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
if (textsAfter) {
  const nextTexts = textsAfter.slice(0, 15);
  console.log(nextTexts.map(t => t.replace(/<[^>]+>/g, '')).join(' '));
}

// If it's in TOC, we need to find where the TOC ends
if (inTOC) {
  console.log('\n⚠ This "Bevindingen" IS in the Table of Contents!');
  console.log('The TOC needs to be updated in Word by pressing F9.');
} else {
  console.log('\n⚠ This "Bevindingen" is NOT in the TOC - it\'s in the document body!');
  console.log('This is the one that needs to be changed to Kop2!');

  // Show the full paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  console.log('\n=== Full paragraph ===');
  console.log(paragraph);
}