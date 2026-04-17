import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Bevindingen paragraph after TABLE 3 ===\n');

// Position from previous script
const bevStart = 154672;
const bevEnd = 154959;

const paragraph = xml.substring(bevStart, bevEnd);

console.log('Full paragraph XML:');
console.log(paragraph);
console.log('\n');

// Parse it
const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
console.log('Style:', styleMatch ? styleMatch[1] : '(none)');

// Check for bookmarks
const hasBookmark = paragraph.includes('bookmarkStart');
console.log('Has bookmark:', hasBookmark);

// Check for hyperlinks
const hasHyperlink = paragraph.includes('hyperlink');
console.log('Has hyperlink:', hasHyperlink);

console.log('\n✓ The paragraph HAS pStyle="Kop2" in the XML');
console.log('✓ If Word shows it differently, the Kop2 style definition may be the issue');