import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Inspecting TOC entries ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;

const tocBlock = xml.substring(sdtStart, sdtEnd);

// Find all paragraphs with "Wierden"
const wierdenPos = tocBlock.indexOf('Wierden');
if (wierdenPos !== -1) {
  console.log('Found "Wierden" at position:', wierdenPos);

  // Show context around it
  const start = Math.max(0, wierdenPos - 500);
  const end = Math.min(tocBlock.length, wierdenPos + 500);
  console.log('\nContext around "Wierden":');
  console.log(tocBlock.substring(start, end));
} else {
  console.log('❌ "Wierden" not found in TOC block');
  console.log('\nSearching in full document...');

  const fullWierdenPos = xml.indexOf('Wierden');
  if (fullWierdenPos !== -1) {
    console.log('Found "Wierden" in document at position:', fullWierdenPos);

    const start = Math.max(0, fullWierdenPos - 500);
    const end = Math.min(xml.length, fullWierdenPos + 500);
    console.log('\nContext:');
    console.log(xml.substring(start, end));
  }
}

// Show all paragraph content in TOC
console.log('\n=== All TOC paragraphs ===');
const paragraphs = tocBlock.match(/<w:p[^>]*>.*?<\/w:p>/gs);
if (paragraphs) {
  paragraphs.forEach((p, i) => {
    // Extract text content
    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
      console.log(`${i + 1}. ${text.substring(0, 100)}`);
    }
  });
}