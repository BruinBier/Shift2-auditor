import PizZip from 'pizzip';
import fs from 'fs';

const testFilePath = './test-toc-output.docx';

if (!fs.existsSync(testFilePath)) {
  console.log('❌ Test file not found:', testFilePath);
  process.exit(1);
}

const content = fs.readFileSync(testFilePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Verifying TOC in generated test report ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;

if (sdtStart === -1 || sdtEnd <= sdtStart) {
  console.log('❌ TOC not found in generated document');
  process.exit(1);
}

const tocBlock = xml.substring(sdtStart, sdtEnd);

console.log('✓ TOC found in document\n');

// Check for unwanted items
const hasWierden = tocBlock.includes('Wierden');
const hasFormulierenTitle = tocBlock.includes('Toegankelijkheidsonderzoek formulieren');
const hasInhoudEntry = tocBlock.match(/Inhoud.*?PAGEREF/);

console.log('Checking for items that should NOT be in TOC:');
console.log(`  "Toegankelijkheidsonderzoek formulieren" title: ${hasFormulierenTitle ? '❌ FOUND (BAD)' : '✓ Not found (GOOD)'}`);
console.log(`  "Inhoud" entry: ${hasInhoudEntry ? '❌ FOUND (BAD)' : '✓ Not found (GOOD)'}`);
console.log(`  "Wierden": ${hasWierden ? '❌ FOUND (BAD)' : '✓ Not found (GOOD)'}`);

// Show all TOC entries
console.log('\n=== All TOC entries in generated report ===\n');
const paragraphs = tocBlock.match(/<w:p[^>]*>.*?<\/w:p>/gs);
if (paragraphs) {
  let entryNumber = 0;
  paragraphs.forEach((p) => {
    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
      // Skip TOC field definition and empty entries
      if (text.trim() && !text.includes('TOC \\o') && text.length > 2) {
        entryNumber++;
        console.log(`${entryNumber}. ${text.substring(0, 100)}`);
      }
    }
  });
}

// Final verdict
console.log('\n=== Verdict ===\n');
if (!hasFormulierenTitle && !hasInhoudEntry && !hasWierden) {
  console.log('✅ SUCCESS! TOC is correct - unwanted items have been removed.');
  console.log('✅ The template changes are working correctly!');
} else {
  console.log('❌ PROBLEM: Some unwanted items are still in the TOC.');
  console.log('   You may need to update the TOC field in Word.');
}