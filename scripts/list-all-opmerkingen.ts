import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

let pos = xml.indexOf('Opmerkingen');
let count = 0;

console.log('=== All "Opmerkingen" occurrences ===\n');

while (pos !== -1) {
  count++;

  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Style: ${styleMatch ? styleMatch[1] : '(none)'}`);
  console.log(`   Preview: ${paragraph.substring(0, 200)}...`);
  console.log();

  // Show the last one (likely the body one)
  if (count > 0) {
    const nextPos = xml.indexOf('Opmerkingen', pos + 1);
    if (nextPos === -1) {
      console.log('=== Last Opmerkingen (body) - Full paragraph ===\n');
      console.log(paragraph);
    }
  }

  pos = xml.indexOf('Opmerkingen', pos + 1);
}

console.log(`\nTotal: ${count} occurrences`);