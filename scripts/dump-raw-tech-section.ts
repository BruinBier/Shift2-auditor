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

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Find Technologieën section
const techHeadingIndex = xmlContent.indexOf('>Technologieën<');
if (techHeadingIndex === -1) {
  console.error('Technologieën heading not found');
  process.exit(1);
}

// Find start of heading paragraph
const techSectionStart = xmlContent.lastIndexOf('<w:p ', techHeadingIndex);

// Find end (before Testomgeving heading)
const testHeadingIndex = xmlContent.indexOf('>Testomgeving<', techHeadingIndex);
const testSectionStart = xmlContent.lastIndexOf('<w:p ', testHeadingIndex);

const techSection = xmlContent.substring(techSectionStart, testSectionStart);

console.log('='.repeat(100));
console.log('RAW XML - Technologieën Section');
console.log('='.repeat(100));
console.log(techSection);
console.log('='.repeat(100));

// Also check testomgeving section
const testSectionEnd = xmlContent.indexOf('</w:sdtContent>', testHeadingIndex);
const testSection = xmlContent.substring(testSectionStart, testSectionEnd);

console.log('\n\n');
console.log('='.repeat(100));
console.log('RAW XML - Testomgeving Section');
console.log('='.repeat(100));
console.log(testSection);
console.log('='.repeat(100));