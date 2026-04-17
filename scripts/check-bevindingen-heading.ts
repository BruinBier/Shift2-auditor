import PizZip from 'pizzip';
import fs from 'fs';

const content = fs.readFileSync('./templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find all occurrences of "Bevindingen"
let pos = 0;
let count = 0;
while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
  count++;
  console.log(`\n=== Occurrence ${count} at position ${pos} ===`);

  // Get surrounding context
  const before = xml.substring(Math.max(0, pos - 300), pos);
  const after = xml.substring(pos, pos + 1000);

  // Check if it's a heading
  const isHeading = before.includes('pStyle w:val="Heading') || before.includes('pStyle w:val="Kop');
  console.log('Is heading:', isHeading);

  // Extract text elements near this occurrence
  const textMatches = after.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  console.log('Text elements after this occurrence:');
  textMatches?.slice(0, 15).forEach((m, i) => {
    console.log(`  ${i}: ${m}`);
  });

  pos++;
}