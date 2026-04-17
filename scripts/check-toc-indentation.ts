import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking TOC entry indentation ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;
const tocBlock = xml.substring(sdtStart, sdtEnd);

// Find first TOC entry (should be Samenvatting)
const firstEntryMatch = tocBlock.match(/<w:p[^>]*>.*?<w:t>Samenvatting<\/w:t>.*?<\/w:p>/s);

if (firstEntryMatch) {
  const entry = firstEntryMatch[0];
  console.log('First TOC entry (Samenvatting):');
  console.log(entry.substring(0, 500));
  console.log('\n---\n');

  // Check for indentation
  const indMatch = entry.match(/<w:ind w:left="(\d+)"/);
  const hangingMatch = entry.match(/<w:ind[^>]*w:hanging="(\d+)"/);

  if (indMatch) {
    console.log(`Current left indent: ${indMatch[1]} twips (${Math.round(parseInt(indMatch[1]) / 20)} pt)`);
  } else {
    console.log('No left indent found');
  }

  if (hangingMatch) {
    console.log(`Hanging indent: ${hangingMatch[1]} twips`);
  }

  // Check paragraph style
  const styleMatch = entry.match(/pStyle w:val="([^"]+)"/);
  if (styleMatch) {
    console.log(`\nParagraph style: ${styleMatch[1]}`);
  }
} else {
  console.log('ERROR: Could not find first TOC entry');
}