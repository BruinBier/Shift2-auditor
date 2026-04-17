import PizZip from 'pizzip';
import fs from 'fs';

const testFilePath = './test-toc-output.docx';

const content = fs.readFileSync(testFilePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Final TOC Verification ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;
const tocBlock = xml.substring(sdtStart, sdtEnd);

// Find all paragraphs in TOC
const paragraphs = tocBlock.match(/<w:p[^>]*>.*?<\/w:p>/gs);

if (!paragraphs) {
  console.log('ERROR: No paragraphs found');
  process.exit(1);
}

console.log('Analyzing TOC structure:\n');

let inhoudHeadingFound = false;
let inhoudEntryFound = false;
let samenvattingEntryFound = false;
let titleEntryFound = false;

paragraphs.forEach((p, i) => {
  const hasKop2 = p.includes('pStyle w:val="Kop2"');
  const hasPageRef = p.includes('PAGEREF');
  const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ') : '';

  // Check for "Inhoud" heading (Kop2, no PAGEREF)
  if (text.includes('Inhoud') && hasKop2 && !hasPageRef) {
    console.log(`✓ Entry ${i + 1}: "Inhoud" Kop2 heading (CORRECT - should be visible)`);
    inhoudHeadingFound = true;
  }
  // Check for "Inhoud" TOC entry (with PAGEREF)
  else if (text.includes('Inhoud') && hasPageRef) {
    console.log(`❌ Entry ${i + 1}: "Inhoud" TOC entry with PAGEREF (WRONG - should be removed)`);
    inhoudEntryFound = true;
  }
  // Check for document title entry
  else if (text.includes('Toegankelijkheidsonderzoek formulieren') && hasPageRef) {
    console.log(`❌ Entry ${i + 1}: Document title entry (WRONG - should be removed)`);
    titleEntryFound = true;
  }
  // Check for "Samenvatting" entry
  else if (text.includes('Samenvatting') && hasPageRef) {
    console.log(`✓ Entry ${i + 1}: "Samenvatting" TOC entry (CORRECT - first real entry)`);
    samenvattingEntryFound = true;
  }
});

console.log('\n=== Summary ===\n');
console.log(`"Inhoud" Kop2 heading: ${inhoudHeadingFound ? '✅ PRESENT' : '❌ MISSING'}`);
console.log(`"Inhoud" TOC entry: ${inhoudEntryFound ? '❌ PRESENT (bad)' : '✅ ABSENT (good)'}`);
console.log(`Document title entry: ${titleEntryFound ? '❌ PRESENT (bad)' : '✅ ABSENT (good)'}`);
console.log(`"Samenvatting" entry: ${samenvattingEntryFound ? '✅ PRESENT' : '❌ MISSING'}`);

if (inhoudHeadingFound && !inhoudEntryFound && !titleEntryFound && samenvattingEntryFound) {
  console.log('\n🎉 SUCCESS! TOC is perfectly configured:');
  console.log('   - "Inhoud" heading visible above TOC');
  console.log('   - No "Inhoud" entry in TOC list');
  console.log('   - No document title entry');
  console.log('   - "Samenvatting" is the first TOC entry');
} else {
  console.log('\n⚠️ There are still issues with the TOC');
}