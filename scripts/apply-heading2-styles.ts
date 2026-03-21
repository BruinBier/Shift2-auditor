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

let xmlContent = documentXml.getData().toString('utf8');

// The seven main section headings that should be Kop 2 (Heading 2)
const headings = [
  'Samenvatting',
  'Over dit onderzoek',
  'Overzicht resultaten',
  'Bevindingen',
  'Opmerkingen',
  'Borging en vervolg',
  'Onderzoeksdetails'
];

console.log('\n=== Applying Kop2 style to main headings ===\n');

let updatedCount = 0;

headings.forEach(heading => {
  const headingPattern = `>${heading}<`;
  let searchPos = 0;

  while ((searchPos = xmlContent.indexOf(headingPattern, searchPos)) !== -1) {
    // Find the paragraph start
    const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
    const actualParagraphStart = Math.max(paragraphStart, paragraphStart2);

    if (actualParagraphStart === -1) {
      console.log(`⚠️  Could not find paragraph start for "${heading}"`);
      searchPos++;
      continue;
    }

    // Find the paragraph end
    const paragraphEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;

    // Extract the paragraph
    const paragraph = xmlContent.substring(actualParagraphStart, paragraphEnd);

    // Check if this paragraph already has a pStyle
    const hasPStyle = paragraph.includes('<w:pStyle');

    // Check if this is likely a table of contents entry (has hyperlink or is in TOC)
    const isTocEntry = paragraph.includes('<w:hyperlink') ||
                       xmlContent.substring(Math.max(0, actualParagraphStart - 1000), actualParagraphStart).includes('<w:sdt');

    if (isTocEntry) {
      console.log(`⏭️  Skipping TOC entry for "${heading}"`);
      searchPos++;
      continue;
    }

    let updatedParagraph = paragraph;

    if (hasPStyle) {
      // Replace existing pStyle with Kop2
      updatedParagraph = updatedParagraph.replace(/<w:pStyle w:val="[^"]+"\/>/, '<w:pStyle w:val="Kop2"/>');
      console.log(`✏️  Updated existing pStyle to Kop2 for "${heading}"`);
    } else {
      // Add pStyle="Kop2" to the paragraph properties
      // Check if there's already a <w:pPr> section
      if (updatedParagraph.includes('<w:pPr>')) {
        // Insert pStyle at the start of pPr
        updatedParagraph = updatedParagraph.replace('<w:pPr>', '<w:pPr><w:pStyle w:val="Kop2"/>');
        console.log(`✏️  Added Kop2 style to existing pPr for "${heading}"`);
      } else if (updatedParagraph.includes('<w:pPr/>')) {
        // Replace empty pPr
        updatedParagraph = updatedParagraph.replace('<w:pPr/>', '<w:pPr><w:pStyle w:val="Kop2"/></w:pPr>');
        console.log(`✏️  Added Kop2 style (replaced empty pPr) for "${heading}"`);
      } else {
        // Add new pPr section right after <w:p> or <w:p >
        const pTagEnd = updatedParagraph.indexOf('<w:p>') !== -1 ?
          updatedParagraph.indexOf('<w:p>') + '<w:p>'.length :
          updatedParagraph.indexOf('<w:p ') + updatedParagraph.substring(updatedParagraph.indexOf('<w:p ')).indexOf('>') + 1;

        updatedParagraph = updatedParagraph.substring(0, pTagEnd) +
          '<w:pPr><w:pStyle w:val="Kop2"/></w:pPr>' +
          updatedParagraph.substring(pTagEnd);

        console.log(`✏️  Added new pPr with Kop2 style for "${heading}"`);
      }
    }

    // Replace in the full content
    xmlContent = xmlContent.substring(0, actualParagraphStart) +
      updatedParagraph +
      xmlContent.substring(paragraphEnd);

    updatedCount++;

    // Move search position forward
    searchPos = actualParagraphStart + updatedParagraph.length;
  }
});

if (updatedCount === 0) {
  console.log('\n⚠️  No headings were updated!');
  process.exit(0);
}

// Update the document.xml in the ZIP
zip.updateFile('word/document.xml', Buffer.from(xmlContent, 'utf8'));

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`\n💾 Created backup: ${path.basename(backupPath)}`);

// Save the modified template
zip.writeZip(templatePath);

console.log(`✅ Updated template: ${path.basename(templatePath)}`);
console.log(`\n✨ Done! Applied Kop2 style to ${updatedCount} heading(s).`);