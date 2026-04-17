import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find "Opmerkingen" outside of TOC
let pos = xml.indexOf('Opmerkingen');
let count = 0;

while (pos !== -1) {
  count++;

  if (count > 5) { // Skip TOC entries, get the body one
    const pStart = Math.max(
      xml.lastIndexOf('<w:p ', pos),
      xml.lastIndexOf('<w:p>', pos)
    );
    const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
    const paragraph = xml.substring(pStart, pEnd);

    const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);

    console.log(`=== "Opmerkingen" occurrence ${count} ===`);
    console.log(`Style: ${styleMatch ? styleMatch[1] : '(none)'}`);
    console.log(`\nFull paragraph:\n`);
    console.log(paragraph);
    console.log('\n');

    break;
  }

  pos = xml.indexOf('Opmerkingen', pos + 1);
}