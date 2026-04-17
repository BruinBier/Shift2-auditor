import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== All "Bevindingen" occurrences in template ===\n');

let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
  count++;

  // Find the paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Extract style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  // Check if in table
  const context = xml.substring(pStart - 100, pEnd + 100);
  const inTable = context.includes('<w:tc>') || context.includes('</w:tc>');

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Style: ${style}`);
  console.log(`   In table: ${inTable ? 'YES' : 'NO'}`);
  console.log(`   Paragraph preview: ${paragraph.substring(0, 150)}...`);
  console.log();

  pos++;
}

console.log(`Total occurrences: ${count}`);