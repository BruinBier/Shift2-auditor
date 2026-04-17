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

console.log('\n=== Checking TOC Configuration ===\n');

// Find the TOC field instruction
const tocFieldMatch = xmlContent.match(/<w:instrText[^>]*>([^<]*TOC[^<]*)<\/w:instrText>/);

if (tocFieldMatch) {
  console.log('TOC Field Instruction:', tocFieldMatch[1]);
  console.log('');

  // Check if it includes \h (hyperlinks) and \o (outline levels)
  const hasHyperlinks = tocFieldMatch[1].includes('\\h');
  const hasOutline = tocFieldMatch[1].includes('\\o');

  console.log('Has hyperlinks (\\h):', hasHyperlinks ? 'YES ✓' : 'NO ✗');
  console.log('Has outline levels (\\o):', hasOutline ? 'YES ✓' : 'NO ✗');

  if (hasOutline) {
    const outlineMatch = tocFieldMatch[1].match(/\\o "([^"]+)"/);
    if (outlineMatch) {
      console.log('Outline levels:', outlineMatch[1]);
    }
  }
} else {
  console.log('⚠️  No TOC field found!');
}

console.log('\n=== Checking TOC Entries ===\n');

// The seven main section headings
const headings = [
  'Samenvatting',
  'Over dit onderzoek',
  'Overzicht resultaten',
  'Bevindingen',
  'Opmerkingen',
  'Borging en vervolg',
  'Onderzoeksdetails'
];

headings.forEach(heading => {
  const headingPattern = `>${heading}<`;
  let searchPos = 0;

  while ((searchPos = xmlContent.indexOf(headingPattern, searchPos)) !== -1) {
    // Find the paragraph start
    const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
    const actualParagraphStart = Math.max(paragraphStart, paragraphStart2);

    if (actualParagraphStart !== -1) {
      const paragraphEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;
      const paragraph = xmlContent.substring(actualParagraphStart, paragraphEnd);

      // Check if it's in TOC (has hyperlink)
      const isTocEntry = paragraph.includes('<w:hyperlink');

      // Check if it's the actual heading (has Kop2 style)
      const isActualHeading = paragraph.includes('w:val="Kop2"');

      if (isTocEntry) {
        // Check if TOC entry has an anchor link
        const anchorMatch = paragraph.match(/<w:hyperlink w:anchor="([^"]+)"/);
        if (anchorMatch) {
          console.log(`TOC entry "${heading}" → anchor: "${anchorMatch[1]}"`);
        } else {
          console.log(`TOC entry "${heading}" → NO ANCHOR ✗`);
        }
      } else if (isActualHeading) {
        // Check if heading has a bookmark
        const beforeHeading = xmlContent.substring(actualParagraphStart - 500, actualParagraphStart);
        const afterHeading = xmlContent.substring(paragraphEnd, paragraphEnd + 500);

        const bookmarkStartMatch = (beforeHeading + paragraph + afterHeading).match(/<w:bookmarkStart[^>]*w:name="([^"]+)"[^>]*\/>/);

        if (bookmarkStartMatch) {
          console.log(`Heading "${heading}" → bookmark: "${bookmarkStartMatch[1]}" ✓`);
        } else {
          console.log(`Heading "${heading}" → NO BOOKMARK ✗`);
        }
      }
    }

    searchPos++;
  }
});