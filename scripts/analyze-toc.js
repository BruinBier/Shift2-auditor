/**
 * Analyze the TOC structure in rapport-ijsselstein-toegankelijk.docx
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../rapport-ijsselstein-toegankelijk.docx');

console.log('🔍 Analyzing TOC in rapport-ijsselstein-toegankelijk.docx...\n');

const content = fs.readFileSync(SOURCE_PATH, 'binary');
const zip = new PizZip(content);
const docXml = zip.file('word/document.xml').asText();

console.log(`📏 Document size: ${docXml.length} characters\n`);

// Search for various TOC patterns
console.log('🔎 Searching for TOC patterns...\n');

// Pattern 1: Standard TOC field
if (docXml.includes('TOC \\o')) {
  console.log('✓ Found standard TOC field (TOC \\o)');
  const tocIndex = docXml.indexOf('TOC \\o');
  console.log(`  Position: ${tocIndex}`);
  console.log(`  Context: ${docXml.substring(tocIndex - 100, tocIndex + 200)}\n`);
}

// Pattern 2: Field characters
if (docXml.includes('fldChar')) {
  const count = (docXml.match(/fldChar/g) || []).length;
  console.log(`✓ Found ${count} field characters (fldChar)`);

  // Find first few fldChar instances
  let pos = 0;
  for (let i = 0; i < Math.min(3, count); i++) {
    pos = docXml.indexOf('fldChar', pos);
    if (pos !== -1) {
      console.log(`  ${i + 1}. ${docXml.substring(pos - 50, pos + 100)}`);
      pos += 7;
    }
  }
  console.log('');
}

// Pattern 3: instrText (field instructions)
if (docXml.includes('instrText')) {
  const count = (docXml.match(/instrText/g) || []).length;
  console.log(`✓ Found ${count} instruction text elements (instrText)`);

  let pos = 0;
  for (let i = 0; i < Math.min(3, count); i++) {
    pos = docXml.indexOf('<w:instrText', pos);
    if (pos !== -1) {
      const end = docXml.indexOf('</w:instrText>', pos);
      console.log(`  ${i + 1}. ${docXml.substring(pos, end + 14)}`);
      pos = end + 14;
    }
  }
  console.log('');
}

// Pattern 4: Hyperlinks (TOC entries are often hyperlinks)
if (docXml.includes('hyperlink')) {
  const count = (docXml.match(/hyperlink/g) || []).length;
  console.log(`✓ Found ${count} hyperlink elements\n`);
}

// Pattern 5: Search for "Inhoudsopgave"
if (docXml.includes('Inhoudsopgave')) {
  console.log('✓ Found "Inhoudsopgave" text');
  const index = docXml.indexOf('Inhoudsopgave');
  console.log(`  Position: ${index}`);
  console.log(`  Context (500 chars after):`);
  console.log(`  ${docXml.substring(index, index + 500)}\n`);
}

// Extract a section that might contain the TOC
console.log('📝 Extracting potential TOC section...\n');

// Find Inhoudsopgave and extract 5000 characters after it
const tocStart = docXml.indexOf('Inhoudsopgave');
if (tocStart !== -1) {
  const tocSection = docXml.substring(tocStart, tocStart + 5000);

  // Save to file for inspection
  const outputPath = path.join(__dirname, '../toc-section-analysis.xml');
  fs.writeFileSync(outputPath, tocSection);

  console.log(`✅ Saved TOC section to: ${outputPath}`);
  console.log('   Open this file to see the exact TOC structure\n');
}

console.log('✨ Analysis complete!');