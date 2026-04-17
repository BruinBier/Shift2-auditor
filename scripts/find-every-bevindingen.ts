import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== EVERY "Bevindingen" occurrence ===\n');

// Find table 3 (the Onderzoek scores table)
const onderzoekScoresPos = xml.indexOf('Onderzoek scores');
const table3Start = xml.indexOf('<w:tbl', onderzoekScoresPos);
const table3End = xml.indexOf('</w:tbl>', table3Start) + '</w:tbl>'.length;

console.log('Onderzoek scores heading at:', onderzoekScoresPos);
console.log('TABLE 3 (scores table) at:', table3Start);
console.log('TABLE 3 ends at:', table3End);
console.log();

// Find ALL Bevindingen
let pos = 0;
let count = 0;

while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
  count++;

  // Get paragraph
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  // Determine location relative to table
  let location = '';
  if (pos < onderzoekScoresPos) {
    location = 'BEFORE Onderzoek scores heading';
  } else if (pos > onderzoekScoresPos && pos < table3Start) {
    location = 'Between Onderzoek scores heading and table';
  } else if (pos > table3Start && pos < table3End) {
    location = 'INSIDE the scores table';
  } else if (pos > table3End && pos < table3End + 5000) {
    location = 'RIGHT AFTER the scores table';
  } else {
    location = 'Far after the scores table';
  }

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Location: ${location}`);
  console.log(`   Style: ${style}`);
  console.log(`   Distance from table end: ${pos - table3End} chars`);

  if (location === 'RIGHT AFTER the scores table') {
    console.log('   ⭐ THIS IS THE ONE YOU SEE ON PAGE 6!');
    console.log(`   Paragraph start: ${pStart}`);
    console.log(`   Paragraph end: ${pEnd}`);
    console.log(`   Full paragraph: ${paragraph.substring(0, 300)}`);
  }

  console.log();

  pos++;
}

console.log(`Total found: ${count}`);