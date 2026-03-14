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

// Extract only the Inhopg2 paragraphs (keep them as-is)
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

// Create a proper TOC field with the existing Heading 2 entries as the field result
// The TOC field has three parts: begin, instruction, separate, content, end
let newContent = '';

if (heading2Paragraphs.length > 0) {
  // Wrap all Heading 2 paragraphs in a proper TOC field
  // This makes them part of the TOC field result, not standalone paragraphs

  // Start with the first paragraph and add TOC field begin + instruction
  const firstPara = heading2Paragraphs[0];
  const pTagEnd = firstPara.indexOf('>') + 1;

  const tocFieldStart = `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "2-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`;

  const modifiedFirstPara = firstPara.substring(0, pTagEnd) + tocFieldStart + firstPara.substring(pTagEnd);

  // End with the last paragraph and add TOC field end
  const lastPara = heading2Paragraphs[heading2Paragraphs.length - 1];
  const lastPEndTag = lastPara.lastIndexOf('</w:p>');

  const tocFieldEnd = `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;

  const modifiedLastPara = lastPara.substring(0, lastPEndTag) + tocFieldEnd + lastPara.substring(lastPEndTag);

  // Build the complete content
  if (heading2Paragraphs.length === 1) {
    // Only one paragraph - add both start and end to it
    newContent = modifiedFirstPara.substring(0, modifiedFirstPara.lastIndexOf('</w:p>')) + tocFieldEnd + '</w:p>';
  } else {
    // Multiple paragraphs - start in first, end in last
    const middleParagraphs = heading2Paragraphs.slice(1, -1);
    newContent = modifiedFirstPara + '\n' + middleParagraphs.join('\n') + '\n' + modifiedLastPara;
  }
} else {
  newContent = '<!-- No Heading 2 entries found -->';
}

// Replace the SDT content
const newXmlContent =
  xmlContent.substring(0, sdtContentStart + '<w:sdtContent>'.length) +
  newContent +
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
console.log('✅ Updated template with TOC configured for Heading 2 only');
console.log(`   Kept ${heading2Paragraphs.length} Heading 2 entries`);
console.log('');
console.log('The TOC now shows only Heading 2 items and will update correctly when fields are updated.');