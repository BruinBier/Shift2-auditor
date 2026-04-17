import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding "Onderzoek scores" ===\n');

// Find all occurrences
let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Onderzoek scores', pos)) !== -1) {
  count++;
  console.log(`\nOccurrence #${count} at position ${pos}`);

  // Find the paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Check style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`  Style: ${style}`);

  // Extract text around it
  const textMatches = paragraph.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ') : '';
  console.log(`  Context: ${text.substring(0, 100)}`);

  pos++;
}

console.log(`\n\nTotal occurrences: ${count}`);