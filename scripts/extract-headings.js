/**
 * Extract all headings from rapport-ijsselstein-toegankelijk.docx to understand structure
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../rapport-ijsselstein-toegankelijk.docx');

console.log('📚 Extracting document structure...\n');

const content = fs.readFileSync(SOURCE_PATH, 'binary');
const zip = new PizZip(content);
const docXml = zip.file('word/document.xml').asText();

// Extract all paragraphs with heading styles
const headingPattern = /<w:pStyle w:val="(Kop\d|Heading\d|Title|Subtitle)"[^>]*\/>[^<]*<\/w:pPr>[\s\S]*?<w:t[^>]*>([^<]+)<\/w:t>/g;

console.log('🔍 Found headings:\n');

let match;
let headingCount = 0;
while ((match = headingPattern.exec(docXml)) !== null) {
  const style = match[1];
  const text = match[2];
  console.log(`  ${style.padEnd(12)} | ${text}`);
  headingCount++;
}

if (headingCount === 0) {
  console.log('  (No headings with explicit styles found)\n');
  console.log('🔍 Trying alternative method - looking for all text elements...\n');

  // Extract first 100 text elements
  const textPattern = /<w:t[^>]*>([^<]+)<\/w:t>/g;
  let textMatch;
  let count = 0;

  while ((textMatch = textPattern.exec(docXml)) !== null && count < 50) {
    const text = textMatch[1].trim();
    if (text.length > 2) {
      console.log(`  ${count + 1}. ${text}`);
      count++;
    }
  }
}

console.log('\n✨ Done!');