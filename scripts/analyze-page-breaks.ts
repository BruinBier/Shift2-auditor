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

  // Find all page breaks and show context
  const pageBreakPattern = /<w:br w:type="page"\/>/g;
  let match;
  let pageBreakIndex = 0;

  console.log('Page breaks found in template:\n');

  while ((match = pageBreakPattern.exec(xmlContent)) !== null) {
    pageBreakIndex++;
    const position = match.index;

    // Get 200 characters before and after
    const contextBefore = xmlContent.substring(Math.max(0, position - 200), position);
    const contextAfter = xmlContent.substring(position + match[0].length, position + match[0].length + 200);

    // Try to extract readable text from context
    const textBefore = contextBefore.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    const textAfter = contextAfter.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

    console.log(`\n=== Page Break ${pageBreakIndex} ===`);
    console.log('Text before:', textBefore ? textBefore.slice(-3).map(t => t.replace(/<[^>]+>/g, '')).join(' ') : 'none');
    console.log('Text after:', textAfter ? textAfter.slice(0, 3).map(t => t.replace(/<[^>]+>/g, '')).join(' ') : 'none');

    // Check if this is likely an unwanted page break (between empty paragraphs)
    const parasBetween = contextBefore.match(/<w:p /g);
    const emptyParasBefore = contextBefore.match(/<w:p[^>]*><w:pPr>.*?<\/w:pPr><\/w:p>/g);
    const emptyParasAfter = contextAfter.match(/<w:p[^>]*><w:pPr>.*?<\/w:pPr><\/w:p>/g);

    if ((emptyParasBefore && emptyParasBefore.length > 0) || (emptyParasAfter && emptyParasAfter.length > 0)) {
      console.log('⚠️  WARNING: This page break appears to be between empty paragraphs!');
    }
  }

  console.log(`\n\nTotal page breaks: ${pageBreakIndex}`);
}