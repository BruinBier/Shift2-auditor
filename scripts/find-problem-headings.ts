import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding headings that should not be in TOC ===\n');

// Find "Inhoud" outside of TOC
let pos = 0;
while ((pos = xml.indexOf('>Inhoud<', pos)) !== -1) {
  // Find the paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Check if this is a heading style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`Found "Inhoud" at position ${pos}`);
  console.log(`  Style: ${style}`);

  // Check if it's a heading that would appear in TOC
  if (style.match(/^(Kop|Heading)/i)) {
    console.log(`  ⚠️ This is a heading that WILL appear in TOC!`);
    console.log(`  Context: ${paragraph.substring(0, 200)}...\n`);
  } else {
    console.log(`  ✓ Not a TOC heading\n`);
  }

  pos++;
}

// Find "Toegankelijkheidsonderzoek formulieren"
console.log('\n=== Looking for document title ===\n');
pos = 0;
while ((pos = xml.indexOf('Toegankelijkheidsonderzoek formulieren', pos)) !== -1) {
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`Found at position ${pos}`);
  console.log(`  Style: ${style}`);

  if (style.match(/^(Kop|Heading)/i)) {
    console.log(`  ⚠️ This is a heading that WILL appear in TOC!`);

    // Extract text
    const textMatches = paragraph.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches) {
      const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
      console.log(`  Text: ${text}\n`);
    }
  } else {
    console.log(`  ✓ Not a TOC heading\n`);
  }

  pos++;
}