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

  // Find the start of bevindingen section
  const startMarker = 'Hieronder worden de vastgestelde afwijkingen beschreven';
  const startIndex = xmlContent.indexOf(startMarker);

  // Find the end - look for the next major heading after bevindingen
  const endMarker1 = 'Opmerkingen';
  const endIndex1 = xmlContent.indexOf(endMarker1, startIndex);

  const endMarker2 = 'Borging en vervolg';
  const endIndex2 = xmlContent.indexOf(endMarker2, startIndex);

  console.log('Bevindingen section:');
  console.log('  Start (intro text):', startIndex);
  console.log('  End option 1 (Opmerkingen):', endIndex1);
  console.log('  End option 2 (Borging en vervolg):', endIndex2);

  if (startIndex !== -1 && endIndex1 !== -1) {
    const sectionLength = endIndex1 - startIndex;
    console.log('\nSection length:', sectionLength, 'characters');

    // Find the paragraph that contains "Opmerkingen"
    // We need to find the start of that paragraph
    const beforeOpmerkingen = xmlContent.substring(endIndex1 - 500, endIndex1);
    const lastPStart = beforeOpmerkingen.lastIndexOf('<w:p ');
    const lastPStart2 = beforeOpmerkingen.lastIndexOf('<w:p>');

    console.log('\nLast <w:p before Opmerkingen:', Math.max(lastPStart, lastPStart2));

    // Show what's just before Opmerkingen
    console.log('\nContext before "Opmerkingen":');
    const context = xmlContent.substring(endIndex1 - 200, endIndex1 + 100);
    const textMatches = context.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches) {
      console.log(textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
    }
  }
}