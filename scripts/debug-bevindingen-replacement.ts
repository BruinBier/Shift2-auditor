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

  // Find the bevindingen section markers
  const bevSectionMarker = 'Hieronder worden de vastgestelde afwijkingen beschreven';
  const bevSectionStart = xmlContent.indexOf(bevSectionMarker);

  console.log('Marker position:', bevSectionStart);

  if (bevSectionStart !== -1) {
    // Look backwards to find where the Bevindingen heading starts
    const before = xmlContent.substring(bevSectionStart - 2000, bevSectionStart);

    // Find all occurrences of "Bevindingen" in this section
    let idx = -1;
    let count = 0;
    while ((idx = before.indexOf('Bevindingen', idx + 1)) !== -1) {
      count++;
      console.log(`\nOccurrence ${count} at relative position ${idx}`);

      // Get context
      const contextStart = Math.max(0, idx - 100);
      const contextEnd = Math.min(before.length, idx + 100);
      const context = before.substring(contextStart, contextEnd);

      console.log('Context:', context.substring(0, 200));
    }

    console.log('\n\nLooking for paragraph start before marker...');
    const beforeMarker = xmlContent.substring(bevSectionStart - 1000, bevSectionStart);

    // Find the last <w:p> before the marker
    const lastPStart1 = beforeMarker.lastIndexOf('<w:p ');
    const lastPStart2 = beforeMarker.lastIndexOf('<w:p>');

    console.log('Last <w:p position (with space):', lastPStart1);
    console.log('Last <w:p> position (without space):', lastPStart2);

    // Show what's in that paragraph
    const actualStart = Math.max(lastPStart1, lastPStart2);
    const paragraphContent = beforeMarker.substring(actualStart);
    console.log('\nParagraph content:');
    console.log(paragraphContent);
  }
}