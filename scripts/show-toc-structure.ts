import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== TOC Structure Analysis ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtContentStart = xml.indexOf('<w:sdtContent>', sdtStart);
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart);

const tocBlock = xml.substring(sdtContentStart, sdtEnd);

console.log('First 3000 characters of TOC content:\n');
console.log(tocBlock.substring(0, 3000));
console.log('\n...\n');