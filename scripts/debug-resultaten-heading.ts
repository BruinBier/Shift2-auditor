import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Debug: Finding exact heading ===\n');

// Find "Resultaten per succecriterium"
let pos = 0;

while ((pos = xml.indexOf('Resultaten per succecriterium', pos)) !== -1) {
  console.log(`\nFound at position: ${pos}`);

  // Find the paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  console.log('Full paragraph:');
  console.log(paragraph);
  console.log('\n---\n');

  pos++;
}