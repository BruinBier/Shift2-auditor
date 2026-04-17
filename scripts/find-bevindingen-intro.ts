import PizZip from 'pizzip';
import fs from 'fs';

const content = fs.readFileSync('./templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find "Bevindingen" as heading
const bevHeadingText = 'Bevindingen';
let searchPos = 0;

while ((searchPos = xml.indexOf(bevHeadingText, searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
    console.log('Found Bevindingen heading');

    // Find end of this paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;

    // Find next Kop3 (criterion heading)
    const nextKop3 = xml.indexOf('pStyle w:val="Kop3"', headingEnd);

    if (nextKop3 !== -1) {
      // Find start of that paragraph
      const nextKop3Start = xml.lastIndexOf('<w:p', nextKop3);

      // Extract everything between heading end and next Kop3
      const inBetween = xml.substring(headingEnd, nextKop3Start);

      console.log('\n=== Content between Bevindingen heading and first criterion ===\n');
      console.log('Length:', inBetween.length, 'characters');

      // Extract all text from this section
      const textMatches = inBetween.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (textMatches && textMatches.length > 0) {
        console.log('\nText content:');
        textMatches.forEach(m => {
          const text = m.replace(/<[^>]+>/g, '');
          if (text.trim()) {
            console.log('  "' + text + '"');
          }
        });
      } else {
        console.log('No text content found (only empty paragraphs or page breaks)');
      }

      // Show raw XML (first 500 chars)
      console.log('\nRaw XML (first 500 chars):');
      console.log(inBetween.substring(0, 500));
    }

    break;
  }
  searchPos++;
}