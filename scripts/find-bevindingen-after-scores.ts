import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding Bevindingen after Onderzoek scores ===\n');

// First find "Onderzoek scores"
const onderzoekScores = xml.indexOf('Onderzoek scores');
console.log('Onderzoek scores found at position:', onderzoekScores);

if (onderzoekScores !== -1) {
  // Find all "Bevindingen" AFTER this position
  let pos = xml.indexOf('Bevindingen', onderzoekScores);
  let count = 0;

  while (pos !== -1 && count < 5) {
    count++;

    const pStart = Math.max(
      xml.lastIndexOf('<w:p ', pos),
      xml.lastIndexOf('<w:p>', pos)
    );
    const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
    const paragraph = xml.substring(pStart, pEnd);

    const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : '(no style)';

    // Check if in table
    const contextBefore = xml.substring(Math.max(0, pStart - 200), pStart);
    const contextAfter = xml.substring(pEnd, pEnd + 200);
    const inTable = contextBefore.includes('<w:tc>') || contextAfter.includes('</w:tc>') ||
                    contextBefore.includes('<w:tbl') || paragraph.includes('<w:tc>');

    console.log(`\n${count}. "Bevindingen" at position ${pos}`);
    console.log(`   Style: ${style}`);
    console.log(`   In table: ${inTable ? 'YES' : 'NO'}`);
    console.log(`   Distance from Onderzoek scores: ${pos - onderzoekScores} chars`);

    if (inTable) {
      console.log('   ⚠ This is INSIDE a table cell');
    }

    // Show paragraph preview
    console.log(`   Paragraph (first 300 chars):`);
    console.log(`   ${paragraph.substring(0, 300)}`);

    pos = xml.indexOf('Bevindingen', pos + 1);
  }
}