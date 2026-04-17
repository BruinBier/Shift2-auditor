import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Inspecting content before TOC ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');

if (sdtStart === -1) {
  console.log('ERROR: TOC not found');
  process.exit(1);
}

console.log('Found TOC at position:', sdtStart);

// Show 2000 characters before TOC
const before = xml.substring(Math.max(0, sdtStart - 2000), sdtStart);

console.log('\n=== Content before TOC (last 2000 chars) ===\n');

// Find all paragraphs in this section
const paragraphs = before.match(/<w:p[^>]*>.*?<\/w:p>/gs);
if (paragraphs) {
  console.log(`Found ${paragraphs.length} paragraphs before TOC\n`);

  // Show last 5 paragraphs
  const lastParagraphs = paragraphs.slice(-5);
  lastParagraphs.forEach((p, i) => {
    const styleMatch = p.match(/pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : '(no style)';

    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ') : '(no text)';

    console.log(`Paragraph ${i + 1}:`);
    console.log(`  Style: ${style}`);
    console.log(`  Text: ${text.substring(0, 100)}`);
    console.log('');
  });
}

// Also check inside the TOC SDT content for any heading
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;
const tocBlock = xml.substring(sdtStart, sdtEnd);

console.log('\n=== Checking inside TOC SDT ===\n');

// Look for Kop2 or Heading2 inside TOC
const kop2Match = tocBlock.match(/<w:p[^>]*>.*?<w:pStyle w:val="Kop2".*?>.*?<\/w:p>/s);
if (kop2Match) {
  console.log('Found Kop2 inside TOC:');
  const textMatches = kop2Match[0].match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ') : '(no text)';
  console.log(`  Text: ${text}`);
  console.log('\n  This heading is INSIDE the TOC structure');
} else {
  console.log('No Kop2 heading found inside TOC');
}