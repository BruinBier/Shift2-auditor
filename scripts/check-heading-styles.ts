import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

const zip = new AdmZip(templatePath);
const documentXml = zip.getEntry('word/document.xml');

if (!documentXml) {
  console.error('Could not find word/document.xml');
  process.exit(1);
}

const xmlContent = documentXml.getData().toString('utf8');

// Find all the main section headings
const headings = [
  'Samenvatting',
  'Over dit onderzoek',
  'Overzicht resultaten',
  'Bevindingen',
  'Opmerkingen',
  'Borging en vervolg',
  'Onderzoeksdetails'
];

console.log('\n=== Checking heading styles ===\n');

headings.forEach(heading => {
  const headingPattern = `>${heading}<`;
  let searchPos = 0;
  let foundCount = 0;

  while ((searchPos = xmlContent.indexOf(headingPattern, searchPos)) !== -1) {
    foundCount++;

    // Look backwards for the paragraph start
    const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
    const actualParagraphStart = Math.max(paragraphStart, paragraphStart2);

    if (actualParagraphStart !== -1) {
      const paragraphEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;
      const paragraph = xmlContent.substring(actualParagraphStart, paragraphEnd);

      // Check if it's in TOC
      const isTocEntry = paragraph.includes('<w:hyperlink') ||
                         xmlContent.substring(Math.max(0, actualParagraphStart - 1000), actualParagraphStart).includes('<w:sdt');

      // Find pStyle
      const pStyleMatch = paragraph.match(/<w:pStyle w:val="([^"]+)"/);
      const style = pStyleMatch ? pStyleMatch[1] : 'NO STYLE';

      if (isTocEntry) {
        console.log(`"${heading}" (TOC entry ${foundCount}): ${style}`);
      } else {
        console.log(`"${heading}" (occurrence ${foundCount}): ${style}`);
      }
    }

    searchPos++;
  }

  if (foundCount === 0) {
    console.log(`"${heading}": NOT FOUND`);
  }
});