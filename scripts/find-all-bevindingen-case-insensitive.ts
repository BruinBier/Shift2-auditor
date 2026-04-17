import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding ALL "bevindingen" (case insensitive) ===\n');

// Case insensitive search
const regex = /bevindingen/gi;
let match;
let count = 0;

while ((match = regex.exec(xml)) !== null) {
  count++;
  const pos = match.index;

  // Get paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  // Extract all text from this paragraph
  const textMatches = paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  const fullText = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '';

  // Check if in TOC
  const inTOC = style.includes('Inhopg');

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Full paragraph text: "${fullText}"`);
  console.log(`   Style: ${style}`);
  console.log(`   In TOC: ${inTOC ? 'YES' : 'NO'}`);

  if (count === 3) {
    console.log('\n   ⭐⭐⭐ THIS IS THE THIRD ONE! ⭐⭐⭐');
    console.log(`   Paragraph start: ${pStart}`);
    console.log(`   Paragraph end: ${pEnd}`);
    console.log(`\n   Full paragraph XML:`);
    console.log(`   ${paragraph}`);
  }

  console.log();
}

console.log(`Total found: ${count}`);

if (count < 3) {
  console.log('\n⚠ WARNING: Only found', count, 'occurrences, not 3!');
  console.log('The third one might be in a different format or split across text nodes.');
}