import PizZip from 'pizzip';
import fs from 'fs';

const content = fs.readFileSync('./templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find the Bevindingen heading
let searchPos = 0;
let bevHeadingStart = -1;

while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
    const paragraphStart = xml.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = xml.lastIndexOf('<w:p>', searchPos);
    bevHeadingStart = Math.max(paragraphStart, paragraphStart2);
    console.log('Found Bevindingen heading at position:', bevHeadingStart);

    // Find the end of this paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;
    console.log('Heading ends at position:', headingEnd);

    // Get the next 2000 characters after the heading
    const after = xml.substring(headingEnd, headingEnd + 2000);

    // Extract all paragraphs
    const paragraphs = after.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);
    console.log('\nParagraphs after Bevindingen heading:');
    paragraphs?.slice(0, 5).forEach((p, i) => {
      console.log(`\n--- Paragraph ${i + 1} ---`);
      // Extract text from this paragraph
      const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (textMatches) {
        const text = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('');
        console.log('Text:', text);
      } else {
        console.log('(empty paragraph)');
      }
      console.log('XML:', p.substring(0, 300));
    });

    break;
  }
  searchPos++;
}