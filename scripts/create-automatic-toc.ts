import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Reading template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found in template');
  process.exit(1);
}

let xmlContent = documentXml.asText();

console.log('Looking for TOC section...');

// Find the "Inhoud" heading
const inhoudIndex = xmlContent.indexOf('Inhoud</w:t>');
if (inhoudIndex === -1) {
  console.error('Could not find "Inhoud" heading');
  process.exit(1);
}

console.log('Found "Inhoud" heading');

// Find the SDT content area after "Inhoud"
const sdtContentStart = xmlContent.indexOf('<w:sdtContent>', inhoudIndex);
if (sdtContentStart === -1) {
  console.error('Could not find SDT content area');
  process.exit(1);
}

const sdtContentEnd = xmlContent.indexOf('</w:sdtContent>', sdtContentStart);
if (sdtContentEnd === -1) {
  console.error('Could not find SDT content end');
  process.exit(1);
}

console.log('Found SDT content area');

// Create an automatic TOC field that Word will populate
// Structure: begin -> instruction -> separate -> [Word generates content here] -> end
const automaticTocField = `<w:p>
  <w:pPr>
    <w:pStyle w:val="Inhopg2"/>
  </w:pPr>
  <w:r>
    <w:fldChar w:fldCharType="begin"/>
  </w:r>
  <w:r>
    <w:instrText xml:space="preserve"> TOC \\o "2-2" \\h \\z \\u </w:instrText>
  </w:r>
  <w:r>
    <w:fldChar w:fldCharType="separate"/>
  </w:r>
  <w:r>
    <w:t>Right-click and select "Update Field" to generate the table of contents.</w:t>
  </w:r>
  <w:r>
    <w:fldChar w:fldCharType="end"/>
  </w:r>
</w:p>`;

// Replace the SDT content with the automatic TOC field
const newXmlContent =
  xmlContent.substring(0, sdtContentStart + '<w:sdtContent>'.length) +
  automaticTocField +
  xmlContent.substring(sdtContentEnd);

// Update the ZIP
zip.file('word/document.xml', newXmlContent);

// Create backup
const timestamp = Date.now();
const backupPath = templatePath.replace('.docx', `-BACKUP-${timestamp}.docx`);
fs.writeFileSync(backupPath, content, 'binary');
console.log(`Created backup: ${path.basename(backupPath)}`);

// Save the modified template
const newDocxBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, newDocxBuffer);
console.log('✅ Created automatic TOC field');
console.log('');
console.log('The TOC field is configured with: TOC \\o "2-2" \\h \\z \\u');
console.log('');
console.log('This tells Word to:');
console.log('- \\o "2-2"  : Show only outline level 2 (Heading 2)');
console.log('- \\h        : Use hyperlinks');
console.log('- \\z        : Hide tab leader in web view');
console.log('- \\u        : Use outline levels');
console.log('');
console.log('When you open a generated report in Word, the TOC will be automatically');
console.log('populated with ONLY Heading 2 items. You can update it by right-clicking');
console.log('and selecting "Update Field".');