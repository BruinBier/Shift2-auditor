import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding "Resultaten per succecriterium" body heading ===\n');

// Find all occurrences
let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Resultaten per succecriterium', pos)) !== -1) {
  count++;
  console.log(`\nOccurrence #${count} at position ${pos}`);

  // Find the paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Check style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`  Style: ${style}`);

  // Only show if it's a heading (Kop), not TOC (Inhopg)
  if (style.includes('Kop') || style.includes('Heading')) {
    console.log('  ✓ This is the body heading!');
    console.log('  Paragraph (first 400 chars):');
    console.log('  ' + paragraph.substring(0, 400));

    // Check spacing
    const spacingMatch = paragraph.match(/<w:spacing[^>]*w:after="(\d+)"/);
    if (spacingMatch) {
      console.log(`  Current spacing after: ${spacingMatch[1]} twips (${Math.round(parseInt(spacingMatch[1]) / 20)} pt)`);
    } else {
      console.log('  No explicit spacing after (using style default)');
    }
  } else if (style.includes('Inhopg')) {
    console.log('  (This is TOC entry, skipping)');
  }

  pos++;
}

console.log(`\n\nTotal occurrences: ${count}`);