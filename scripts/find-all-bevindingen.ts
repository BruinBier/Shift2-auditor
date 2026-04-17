import PizZip from 'pizzip';
import fs from 'fs';

const content = fs.readFileSync('./templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find all occurrences of "bevindingen" (case insensitive)
const regex = /bevindingen/gi;
let match;
let count = 0;

console.log('=== All occurrences of "bevindingen" in template ===\n');

while ((match = regex.exec(xml)) !== null) {
  count++;
  const pos = match.index;

  // Get surrounding context
  const before = xml.substring(Math.max(0, pos - 300), pos);
  const after = xml.substring(pos, pos + 300);

  // Find the <w:t> tag containing this text
  const textTagMatch = (before + after).match(/<w:t[^>]*>([^<]*bevindingen[^<]*)<\/w:t>/i);

  console.log(`--- Occurrence ${count} at position ${pos} ---`);
  if (textTagMatch) {
    console.log('Full text in tag:', `"${textTagMatch[1]}"`);
  }

  // Check if it's a heading
  const isHeading = before.includes('pStyle w:val="Heading') || before.includes('pStyle w:val="Kop');
  console.log('Is heading:', isHeading);

  // Get the paragraph this is in
  const pStart = before.lastIndexOf('<w:p');
  const pEnd = after.indexOf('</w:p>');
  if (pStart !== -1 && pEnd !== -1) {
    const paragraph = before.substring(pStart) + after.substring(0, pEnd + 6);

    // Extract all text from this paragraph
    const allText = (paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
      .map(t => t.replace(/<[^>]+>/g, ''))
      .join('');

    console.log('Complete paragraph text:', `"${allText}"`);
  }

  console.log();
}

console.log(`Total occurrences: ${count}`);