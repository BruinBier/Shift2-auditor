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

console.log('='.repeat(80));
console.log('DOM, HTML, CSS Items from Template');
console.log('='.repeat(80));

// Find DOM
const domIndex = xmlContent.indexOf('>DOM<');
if (domIndex !== -1) {
  const pStart = xmlContent.lastIndexOf('<w:p ', domIndex);
  const pEnd = xmlContent.indexOf('</w:p>', domIndex) + '</w:p>'.length;
  console.log('\nDOM paragraph:');
  console.log(xmlContent.substring(pStart, pEnd));
}

// Find HTML
const htmlIndex = xmlContent.indexOf('>HTML<');
if (htmlIndex !== -1) {
  const pStart = xmlContent.lastIndexOf('<w:p ', htmlIndex);
  const pEnd = xmlContent.indexOf('</w:p>', htmlIndex) + '</w:p>'.length;
  console.log('\nHTML paragraph:');
  console.log(xmlContent.substring(pStart, pEnd));
}

// Find CSS
const cssIndex = xmlContent.indexOf('>CSS<');
if (cssIndex !== -1) {
  const pStart = xmlContent.lastIndexOf('<w:p ', cssIndex);
  const pEnd = xmlContent.indexOf('</w:p>', cssIndex) + '</w:p>'.length;
  console.log('\nCSS paragraph:');
  console.log(xmlContent.substring(pStart, pEnd));
}

console.log('\n' + '='.repeat(80));
console.log('Google Chrome, Firefox, etc Items from Template');
console.log('='.repeat(80));

// Find first browser
const chromeIndex = xmlContent.indexOf('Google Chrome');
if (chromeIndex !== -1) {
  const pStart = xmlContent.lastIndexOf('<w:p ', chromeIndex);
  const pEnd = xmlContent.indexOf('</w:p>', chromeIndex) + '</w:p>'.length;
  console.log('\nGoogle Chrome paragraph:');
  console.log(xmlContent.substring(pStart, pEnd));
}