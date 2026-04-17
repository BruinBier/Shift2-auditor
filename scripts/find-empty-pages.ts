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

  // Look for page breaks
  const pageBreaks = xmlContent.match(/<w:br w:type="page"\/>/g);
  console.log('Page breaks found:', pageBreaks ? pageBreaks.length : 0);

  // Look for section breaks
  const sectionBreaks = xmlContent.match(/<w:sectPr>/g);
  console.log('Section breaks found:', sectionBreaks ? sectionBreaks.length : 0);

  // Look for empty paragraphs near page breaks
  const emptyParas = xmlContent.match(/<w:p[^>]*>\s*<w:pPr>.*?<\/w:pPr>\s*<\/w:p>/g);
  console.log('Empty paragraphs found:', emptyParas ? emptyParas.length : 0);

  // Save the full document XML to inspect manually
  fs.writeFileSync(
    path.join(process.cwd(), 'template-document-xml.txt'),
    xmlContent
  );
  console.log('Saved full document XML to template-document-xml.txt');

  // Look for consecutive empty paragraphs that might create a blank page
  const lines = xmlContent.split('</w:p>');
  let consecutiveEmpty = 0;
  let maxConsecutiveEmpty = 0;

  for (const line of lines) {
    // Check if paragraph is essentially empty (only formatting, no text)
    if (line.includes('<w:p') && !line.includes('<w:t>')) {
      consecutiveEmpty++;
      maxConsecutiveEmpty = Math.max(maxConsecutiveEmpty, consecutiveEmpty);
    } else {
      consecutiveEmpty = 0;
    }
  }

  console.log('Max consecutive empty paragraphs:', maxConsecutiveEmpty);
}