import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Current "Bevindingen" occurrences in template ===\n');

let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
  count++;

  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  // Get nearby text
  const before = xml.substring(Math.max(0, pos - 1000), pos);
  const nearbyText = before.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  const context = nearbyText ? nearbyText.slice(-3).map(m => m.replace(/<[^>]+>/g, '')).join(' → ') : '';

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Style: ${style}`);
  console.log(`   Context before: ...${context}`);
  console.log();

  pos++;
}

console.log(`Total: ${count} occurrence(s)`);