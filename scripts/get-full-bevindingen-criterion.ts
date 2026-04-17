import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find Bevindingen Kop2
let searchPos = 0;
while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Kop2"')) {
    console.log('Found Bevindingen Kop2 heading at:', searchPos);

    // Find end of heading paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;

    // Find 1.3.3 after this
    const absolutePos = xml.indexOf('1.3.3 Zintuiglijke eigenschappen A', headingEnd);

    if (absolutePos !== -1) {
      console.log('Found 1.3.3 at:', absolutePos);

      // Find FULL paragraph - both with and without space
      const beforeCriterion = xml.substring(0, absolutePos);
      const pWithSpace = beforeCriterion.lastIndexOf('<w:p ');
      const pWithoutSpace = beforeCriterion.lastIndexOf('<w:p>');
      const pStart = Math.max(pWithSpace, pWithoutSpace);

      const pEnd = xml.indexOf('</w:p>', absolutePos) + '</w:p>'.length;

      const fullParagraph = xml.substring(pStart, pEnd);

      console.log('\n=== FULL Paragraph ===');
      console.log(fullParagraph);

      // Check for table context
      const context = xml.substring(pStart - 100, pEnd + 100);
      if (context.includes('<w:tc>') || context.includes('</w:tc>')) {
        console.log('\n⚠ WARNING: This paragraph is inside a table!');
      } else {
        console.log('\n✓ This paragraph is NOT in a table (it\'s a regular paragraph)');
      }
    }

    break;
  }
  searchPos++;
}