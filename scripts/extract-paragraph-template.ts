import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const documentXml = zip.file('word/document.xml');
if (documentXml) {
  const xmlContent = documentXml.asText();

  // Find bevindingen section
  const startMarker = 'Hieronder worden de vastgestelde afwijkingen beschreven';
  const startIndex = xmlContent.indexOf(startMarker);

  if (startIndex !== -1) {
    // Extract section
    const section = xmlContent.substring(startIndex - 1000, startIndex + 8000);

    // Find the heading "1.1.1 Niet-tekstuele"
    const headingText = '1.1.1 Niet-tekstuele';
    const headingIndex = section.indexOf(headingText);

    if (headingIndex !== -1) {
      // Extract the paragraph containing this heading
      const beforeHeading = section.substring(0, headingIndex);
      const pStart = beforeHeading.lastIndexOf('<w:p ');
      const pStart2 = beforeHeading.lastIndexOf('<w:p>');
      const actualStart = Math.max(pStart, pStart2);

      const afterHeading = section.substring(headingIndex);
      const pEnd = afterHeading.indexOf('</w:p>') + '</w:p>'.length;

      const headingParagraph = section.substring(actualStart, headingIndex + pEnd);

      console.log('=== HEADING PARAGRAPH ===');
      console.log(headingParagraph.substring(0, 500));

      // Save to file
      fs.writeFileSync(
        path.join(process.cwd(), 'heading-template.xml'),
        headingParagraph
      );
    }

    // Find a regular paragraph - "Op de pre-loginpagina"
    const paraText = 'Op de pre-loginpagina';
    const paraIndex = section.indexOf(paraText);

    if (paraIndex !== -1) {
      const beforePara = section.substring(0, paraIndex);
      const pStart = beforePara.lastIndexOf('<w:p ');
      const pStart2 = beforePara.lastIndexOf('<w:p>');
      const actualStart = Math.max(pStart, pStart2);

      const afterPara = section.substring(paraIndex);
      const pEnd = afterPara.indexOf('</w:p>') + '</w:p>'.length;

      const paragraph = section.substring(actualStart, paraIndex + pEnd);

      console.log('\n\n=== REGULAR PARAGRAPH ===');
      console.log(paragraph.substring(0, 500));

      fs.writeFileSync(
        path.join(process.cwd(), 'paragraph-template.xml'),
        paragraph
      );
    }
  }
}