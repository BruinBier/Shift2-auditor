import PizZip from 'pizzip';
import fs from 'fs';

const content = fs.readFileSync('test-working.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== FINAL VERIFICATION ===\n');

// Check intro text
const introIdx = xml.indexOf('Dit rapport beschrijft');
if (introIdx !== -1) {
  const introEnd = xml.indexOf('</w:t>', introIdx);
  const introText = xml.substring(introIdx, introEnd);
  console.log('✅ Intro text:');
  console.log('   ' + introText);
  console.log('');
} else {
  console.log('❌ Intro text not found\n');
}

// Check for duplicates
const dupes = xml.split('Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content van de formulieren op').length - 1;
console.log('✅ Duplication check:');
console.log('   Intro appears ' + dupes + ' time(s)');
console.log('');

// Check Website field
const websiteIdx = xml.indexOf('Website</w:t>');
if (websiteIdx !== -1) {
  const hyperlinkStart = xml.indexOf('<w:hyperlink', websiteIdx);
  const hyperlinkEnd = xml.indexOf('</w:hyperlink>', hyperlinkStart);
  if (hyperlinkStart !== -1) {
    const hyperlink = xml.substring(hyperlinkStart, hyperlinkEnd + 15);
    const urlMatch = hyperlink.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
    if (urlMatch) {
      console.log('✅ Website field:');
      console.log('   Website: ' + urlMatch[1]);
      console.log('');
    }
  }
}

// Check for " op op"
if (xml.includes(' op op')) {
  console.log('❌ WARNING: Found " op op" duplication!');
} else {
  console.log('✅ No " op op" duplication found');
}

console.log('\n=== SUMMARY ===');
console.log(dupes === 1 ? '✅ ALL CHECKS PASSED' : '❌ ISSUES FOUND');