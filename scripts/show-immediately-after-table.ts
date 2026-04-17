import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== What is IMMEDIATELY after the Onderzoek scores table? ===\n');

// Find the scores table (table 3)
const onderzoekScoresPos = xml.indexOf('Onderzoek scores');
const tableStart = xml.indexOf('<w:tbl', onderzoekScoresPos);
const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

console.log('Table ends at:', tableEnd);

// Get the IMMEDIATE next 500 chars
const immediate = xml.substring(tableEnd, tableEnd + 500);

console.log('\nFirst 500 characters of XML after table:');
console.log(immediate);

// Extract paragraphs
const paragraphs = immediate.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

console.log('\n\nParsed paragraphs (first 3):');
if (paragraphs) {
  paragraphs.slice(0, 3).forEach((p, i) => {
    const styleMatch = p.match(/pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : '(no style)';

    const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '(empty)';

    console.log(`\n${i + 1}. Style: ${style}`);
    console.log(`   Text: "${text}"`);

    if (text.toLowerCase().includes('bevindingen')) {
      console.log('   ⭐ THIS IS BEVINDINGEN!');
      console.log(`   Absolute position: ${tableEnd + immediate.indexOf(p)}`);
    }
  });
}