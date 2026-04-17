import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking Bevindingen Section Styles ===\n');

// Find Bevindingen
let pos = xml.indexOf('Bevindingen');
while (pos !== -1) {
  const nextPos = xml.indexOf('Bevindingen', pos + 1);

  // Get the paragraph containing this occurrence
  const pStart = xml.lastIndexOf('<w:p', pos);
  const pEnd = xml.indexOf('</w:p>', pos) + 6;
  const paragraph = xml.substring(pStart, pEnd);

  // Extract style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`Found "Bevindingen" at position ${pos}`);
  console.log(`  Style: ${style}`);
  console.log(`  Paragraph XML (first 500 chars):\n${paragraph.substring(0, 500)}\n`);

  if (nextPos === -1) break;
  pos = nextPos;
}

// Find 1.3.3
console.log('\n=== Checking 1.3.3 Criterion ===\n');
pos = xml.indexOf('1.3.3 Zintuiglijke eigenschappen');
if (pos !== -1) {
  const pStart = xml.lastIndexOf('<w:p', pos);
  const pEnd = xml.indexOf('</w:p>', pos) + 6;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`Found "1.3.3 Zintuiglijke eigenschappen A"`);
  console.log(`  Style: ${style}`);
  console.log(`  Paragraph XML (first 500 chars):\n${paragraph.substring(0, 500)}\n`);
} else {
  console.log('1.3.3 criterion not found');
}