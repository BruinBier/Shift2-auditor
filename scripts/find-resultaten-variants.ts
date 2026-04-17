import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Searching for "Resultaten" related headings ===\n');

// Search for variations
const searchTerms = [
  'Resultaten',
  'succecriterium',
  'Overzicht resultaten'
];

searchTerms.forEach(term => {
  console.log(`\nSearching for: "${term}"`);
  let pos = 0;
  let count = 0;

  while ((pos = xml.indexOf(term, pos)) !== -1 && count < 5) {
    count++;

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

    // Extract text
    const textMatches = paragraph.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('') : '';

    if (style.includes('Kop') || style.includes('Heading')) {
      console.log(`  Found in ${style}: "${text.substring(0, 60)}"`);
    }

    pos++;
  }
});