import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Bevindingen Section Structure ===\n');

// Find Bevindingen heading
let searchPos = 0;
while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
    console.log('✓ "Bevindingen" heading found with Kop2/Heading2 style');

    // Find end of this paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;

    // Get next 1000 characters
    const after = xml.substring(headingEnd, headingEnd + 1000);

    // Find next paragraphs
    const paragraphs = after.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

    console.log('\nContent after Bevindingen heading:');

    paragraphs?.slice(0, 5).forEach((p, i) => {
      // Check if it has a heading style
      const kop3Match = p.match(/pStyle w:val="Kop3"/);
      const heading3Match = p.match(/pStyle w:val="Heading3"/);

      // Extract text
      const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '(empty)';

      if (kop3Match || heading3Match) {
        console.log(`  ${i + 1}. [Kop3] "${text}"`);
      } else {
        console.log(`  ${i + 1}. "${text}"`);
      }
    });

    break;
  }
  searchPos++;
}