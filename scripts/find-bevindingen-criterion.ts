import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find Bevindingen Kop2 heading first
let searchPos = 0;
while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Kop2"')) {
    console.log('Found Bevindingen Kop2 heading at:', searchPos);

    // Find end of this paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;

    // Look for 1.3.3 AFTER this heading (within next 2000 chars)
    const afterHeading = xml.substring(headingEnd, headingEnd + 2000);
    const criterionPos = afterHeading.indexOf('1.3.3');

    if (criterionPos !== -1) {
      console.log('Found 1.3.3 at offset', criterionPos, 'after Bevindingen heading');

      // Find the paragraph containing this
      const absolutePos = headingEnd + criterionPos;
      const pStart = xml.lastIndexOf('<w:p', absolutePos);
      const pEnd = xml.indexOf('</w:p>', absolutePos) + '</w:p>'.length;

      const paragraph = xml.substring(pStart, pEnd);

      console.log('\n=== Paragraph containing 1.3.3 after Bevindingen ===');
      console.log(paragraph);

      const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
      console.log('\nStyle:', styleMatch ? styleMatch[1] : 'NONE');
    } else {
      console.log('No 1.3.3 found after this Bevindingen heading');

      // Show what IS after the heading
      console.log('\n=== Content after Bevindingen heading (first 500 chars) ===');
      console.log(afterHeading.substring(0, 500));
    }

    break;
  }
  searchPos++;
}