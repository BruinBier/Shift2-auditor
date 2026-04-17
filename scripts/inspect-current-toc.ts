import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Reading current template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Find the Inhoud section
const inhoudIndex = xmlContent.indexOf('Inhoud</w:t>');
const sdtContentStart = xmlContent.indexOf('<w:sdtContent>', inhoudIndex);
const sdtContentEnd = xmlContent.indexOf('</w:sdtContent>', sdtContentStart);

const tocSection = xmlContent.substring(sdtContentStart, sdtContentEnd + '</w:sdtContent>'.length);

// Save to file
fs.writeFileSync('current-toc-inspection.xml', tocSection, 'utf-8');
console.log('Saved current TOC section to current-toc-inspection.xml');

// Analyze structure
const hasTocInstruction = tocSection.includes('TOC \\o');
const hasFldChar = tocSection.includes('w:fldChar');
const paraCount = (tocSection.match(/<w:p\s/g) || []).length;

console.log('\nCurrent TOC structure:');
console.log('- Has TOC instruction:', hasTocInstruction);
console.log('- Has field characters:', hasFldChar);
console.log('- Number of paragraphs:', paraCount);

if (hasTocInstruction) {
  console.log('\n✅ TOC field instruction is present');

  // Check field structure
  const fldBegin = tocSection.includes('fldCharType="begin"');
  const fldSeparate = tocSection.includes('fldCharType="separate"');
  const fldEnd = tocSection.includes('fldCharType="end"');

  console.log('- Field begin:', fldBegin);
  console.log('- Field separate:', fldSeparate);
  console.log('- Field end:', fldEnd);

  if (fldBegin && fldSeparate && fldEnd) {
    console.log('\n✅ All TOC field markers are present!');
  } else {
    console.log('\n❌ TOC field is incomplete!');
  }
} else {
  console.log('\n❌ No TOC field instruction found - this is still a manual TOC');
}