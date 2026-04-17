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

// Extract the current SDT content
const currentContent = xmlContent.substring(sdtContentStart + '<w:sdtContent>'.length, sdtContentEnd);

// Extract only the Inhopg2 paragraphs (Heading 2 TOC entries)
const paragraphRegex = /<w:p\s[^>]*>[\s\S]*?<\/w:p>/g;
const matches = currentContent.match(paragraphRegex);
const heading2Paragraphs: string[] = [];

if (matches) {
  for (const para of matches) {
    if (para.includes('pStyle w:val="Inhopg2"')) {
      heading2Paragraphs.push(para);
    }
  }
}

console.log(`Found ${heading2Paragraphs.length} Heading 2 entries to keep`);

// Create a proper TOC field that wraps the existing Heading 2 entries
// Structure:
// <paragraph 1 with TOC begin + instruction + separate>
//   existing content of paragraph 1
// </paragraph 1>
// <paragraph 2>
//   existing content
// </paragraph 2>
// ...
// <paragraph N>
//   existing content
//   TOC end field
// </paragraph N>

let properTocField = '';

if (heading2Paragraphs.length > 0) {
  // Modify first paragraph to include TOC field begin
  const firstPara = heading2Paragraphs[0];

  // Find the </w:pPr> closing tag (end of paragraph properties)
  const pPrEndIndex = firstPara.indexOf('</w:pPr>');

  if (pPrEndIndex === -1) {
    console.error('Could not find </w:pPr> in first paragraph');
    process.exit(1);
  }

  // Insert TOC field markers AFTER the paragraph properties, before content
  const tocBegin = `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "2-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`;

  const modifiedFirstPara = firstPara.substring(0, pPrEndIndex + '</w:pPr>'.length) + tocBegin + firstPara.substring(pPrEndIndex + '</w:pPr>'.length);

  // Modify last paragraph to include TOC field end
  const lastPara = heading2Paragraphs[heading2Paragraphs.length - 1];

  // Find the closing </w:p> tag
  const lastParaEnd = lastPara.lastIndexOf('</w:p>');

  // Insert TOC end field before closing tag
  const tocEnd = `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;

  const modifiedLastPara = lastPara.substring(0, lastParaEnd) + tocEnd + lastPara.substring(lastParaEnd);

  // Build the complete TOC field content
  if (heading2Paragraphs.length === 1) {
    // Only one paragraph - both begin and end in same paragraph
    properTocField = modifiedFirstPara.substring(0, modifiedFirstPara.lastIndexOf('</w:p>')) + tocEnd + '</w:p>';
  } else {
    // Multiple paragraphs
    const middleParagraphs = heading2Paragraphs.slice(1, -1);
    properTocField = modifiedFirstPara + '\n' + middleParagraphs.join('\n') + '\n' + modifiedLastPara;
  }
} else {
  console.error('No Heading 2 entries found!');
  process.exit(1);
}

// Replace the SDT content with the proper TOC field
const newXmlContent =
  xmlContent.substring(0, sdtContentStart + '<w:sdtContent>'.length) +
  properTocField +
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
console.log('✅ Created proper TOC field with existing Heading 2 entries');
console.log(`   Wrapped ${heading2Paragraphs.length} Heading 2 items in TOC field`);
console.log('');
console.log('The TOC now contains:');
console.log('- All existing Heading 2 links (visible in the template)');
console.log('- A proper TOC field configured with \\o "2-2" (only Heading 2)');
console.log('');
console.log('When Word updates the TOC (or when you right-click and choose "Update Field"),');
console.log('it will regenerate the TOC showing ONLY Heading 2 items from the document.');