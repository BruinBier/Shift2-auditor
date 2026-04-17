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

const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('numbering.xml not found');
  process.exit(1);
}

const xmlContent = numberingXml.asText();

console.log('Numbering definitions:');
console.log(xmlContent);