import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Load the template
const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Get document.xml
const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

let xmlContent = documentXml.asText();

// Find the Technologieën section
const techHeadingIndex = xmlContent.indexOf('>Technologieën<');
if (techHeadingIndex === -1) {
  console.error('Technologieën heading not found');
  process.exit(1);
}

// Find the section boundaries
const techSectionStart = xmlContent.lastIndexOf('<w:p ', techHeadingIndex);
const testHeadingIndex = xmlContent.indexOf('>Testomgeving<', techHeadingIndex);
const testSectionEnd = xmlContent.indexOf('</w:p>', testHeadingIndex) + '</w:p>'.length;

// Find next section boundary after testomgeving
const afterTestIndex = xmlContent.indexOf('<w:p ', testSectionEnd);
const sectionEndIndex = xmlContent.indexOf('</w:p>', afterTestIndex + 500) + '</w:p>'.length;

// Extract just these two sections
const extractedSection = xmlContent.substring(techSectionStart, sectionEndIndex);

// Create a minimal document with just these sections
const minimalDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid">
  <w:body>
    ${extractedSection}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

// Replace document.xml in the ZIP
zip.file('word/document.xml', minimalDoc);

// Save test document
const testPath = path.join(process.cwd(), 'TEST-font-comparison.docx');
const buffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(testPath, buffer);

console.log('✅ Created test document:', testPath);
console.log('\nThis document contains ONLY:');
console.log('- Technologieën heading');
console.log('- DOM, HTML, CSS list (numId=5 → abstractNum 1 → 22 = 11pt)');
console.log('- Testomgeving heading  ');
console.log('- Browser list (numId=4 → abstractNum 2 → 22 = 11pt)');
console.log('\nOpen this file in Microsoft Word and check if both lists have the same font size.');
console.log('Use Word\'s "Reveal Formatting" (Shift+F1) to see the actual font size.');