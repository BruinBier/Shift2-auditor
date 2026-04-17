import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding Bevindingen that is NOT in TOC ===\n');

// Find all Bevindingen
let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
  count++;

  // Get context
  const before = xml.substring(Math.max(0, pos - 500), pos);
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  // Check if it's in TOC
  const inTOC = style.includes('Inhopg') || before.includes('docPartGallery w:val="Table of Contents"');

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Style: ${style}`);
  console.log(`   In TOC: ${inTOC ? 'YES (skip this!)' : 'NO (this might be the one!)'}`);

  if (!inTOC) {
    console.log(`\n   ⭐ THIS IS A BODY HEADING (not in TOC)`);
    console.log(`   Position: ${pos}`);
    console.log(`   Paragraph start: ${pStart}`);
    console.log(`   Paragraph end: ${pEnd}`);
    console.log(`   Current style: ${style}`);
    console.log(`   Paragraph preview:`);
    console.log(`   ${paragraph.substring(0, 400)}`);

    if (style !== 'Kop2') {
      console.log(`\n   ❌ NEEDS TO BE CHANGED TO KOP2!`);
    } else {
      console.log(`\n   ✓ Already has Kop2 style`);
    }
  }

  console.log();
  pos++;
}