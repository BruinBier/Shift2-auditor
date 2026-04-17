import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== ALL "Bevindingen" occurrences in document ===\n');

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

  // Get style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no paragraph style)';

  // Check if in table
  const contextBefore = xml.substring(Math.max(0, pStart - 500), pStart);
  const contextAfter = xml.substring(pEnd, Math.min(xml.length, pEnd + 500));
  const inTable = contextBefore.includes('<w:tbl') && !contextBefore.includes('</w:tbl>');

  // Get surrounding text (before and after)
  const before = xml.substring(Math.max(0, pos - 2000), pos);
  const after = xml.substring(pos, pos + 2000);

  // Find nearby headings
  const nearbyHeadings: string[] = [];
  const headingMatches = before.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (headingMatches) {
    headingMatches.slice(-10).forEach(m => {
      const text = m.replace(/<[^>]+>/g, '');
      if (text.length > 3 && text.length < 50) {
        nearbyHeadings.push(text);
      }
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${count}. Position: ${pos}`);
  console.log(`   Style: ${style}`);
  console.log(`   In table: ${inTable ? 'YES' : 'NO'}`);
  console.log(`   Nearby text before: ${nearbyHeadings.slice(-3).join(' → ')}`);

  // Show paragraph
  console.log(`\n   Full paragraph:`);
  console.log(`   ${paragraph.substring(0, 400)}`);

  pos++;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`\nTotal occurrences: ${count}`);