import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find "Samenvatting" heading (should be Kop2)
const samenvatting = xml.indexOf('Samenvatting');
if (samenvatting > 10000) { // Skip TOC entries
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', samenvatting),
    xml.lastIndexOf('<w:p>', samenvatting)
  );
  const pEnd = xml.indexOf('</w:p>', samenvatting) + '</w:p>'.length;

  const paragraph = xml.substring(pStart, pEnd);

  console.log('=== Samenvatting Kop2 Paragraph (working example) ===\n');
  console.log(paragraph);
  console.log('\n\nLength:', paragraph.length, 'chars');
}

// Find "Onderzoeksdetails" heading (should also be Kop2)
const onderzoek = xml.indexOf('Onderzoeksdetails');
if (onderzoek > 10000) {
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', onderzoek),
    xml.lastIndexOf('<w:p>', onderzoek)
  );
  const pEnd = xml.indexOf('</w:p>', onderzoek) + '</w:p>'.length;

  const paragraph = xml.substring(pStart, pEnd);

  console.log('\n\n=== Onderzoeksdetails Kop2 Paragraph ===\n');
  console.log(paragraph);
}