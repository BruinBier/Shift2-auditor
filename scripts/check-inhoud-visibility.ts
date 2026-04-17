import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking "Inhoud" heading visibility ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtContentStart = xml.indexOf('<w:sdtContent>', sdtStart);
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart);

// Get content after <w:sdtContent>
const afterSdtContent = xml.substring(sdtContentStart, sdtContentStart + 1500);

console.log('Content immediately after <w:sdtContent> (first 1500 chars):\n');
console.log(afterSdtContent);
console.log('\n---\n');

// Check if there's a Kop2 paragraph with "Inhoud"
const kop2Match = afterSdtContent.match(/<w:p[^>]*>.*?<w:pStyle w:val="Kop2".*?>.*?<w:t>Inhoud<\/w:t>.*?<\/w:p>/s);

if (kop2Match) {
  console.log('✓ Found Kop2 "Inhoud" heading');
  console.log('\nFull paragraph:');
  console.log(kop2Match[0]);

  // Check for hidden properties
  if (kop2Match[0].includes('<w:vanish/>')) {
    console.log('\n⚠️ WARNING: Heading has vanish property (hidden text)!');
  }
  if (kop2Match[0].includes('w:val="0"')) {
    console.log('\n⚠️ WARNING: Heading might be hidden with w:val="0"!');
  }
} else {
  console.log('❌ No Kop2 "Inhoud" heading found');
}