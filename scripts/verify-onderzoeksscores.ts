import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Verifying "Onderzoeksscores" ===\n');

let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Onderzoeksscores', pos)) !== -1) {
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
  console.log(`  ${style === 'Inhopg3' ? '✓ TOC entry' : style === 'Kop3' ? '✓ Body heading' : 'Other'}`);

  pos++;
}

console.log(`\n\n✓ Total: ${count} occurrence(s) of "Onderzoeksscores"`);