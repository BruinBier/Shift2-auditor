import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking position of Onderzoek scores table and Bevindingen ===\n');

// Find Onderzoek scores table
const onderzoekPos = xml.indexOf('Onderzoek scores');
const tableStart = xml.indexOf('<w:tbl', onderzoekPos);
const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

console.log('Onderzoek scores heading:', onderzoekPos);
console.log('Table starts:', tableStart);
console.log('Table ends:', tableEnd);

// Find Bevindingen
const bevPos = xml.indexOf('Bevindingen');
console.log('Bevindingen:', bevPos);

console.log('\nDistance from table end to Bevindingen:', bevPos - tableEnd, 'chars');

// Show what's between table and Bevindingen
const between = xml.substring(tableEnd, bevPos);

console.log('\n=== Content between table end and Bevindingen ===');
console.log('Length:', between.length, 'chars\n');

// Extract paragraphs
const paragraphs = between.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

if (paragraphs) {
  console.log(`${paragraphs.length} paragraphs between table and Bevindingen:\n`);

  paragraphs.forEach((p, i) => {
    const styleMatch = p.match(/pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : '(no style)';

    const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '(empty)';

    if (text.trim() && text.trim().length > 3) {
      console.log(`  ${i + 1}. [${style}] "${text.substring(0, 70)}"`);
    }
  });
} else {
  console.log('(No content between table and Bevindingen)');
}