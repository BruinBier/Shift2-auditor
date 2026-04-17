import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding what comes after Onderzoek scores table ===\n');

// Find "Onderzoek scores" heading
const onderzoekPos = xml.indexOf('Onderzoek scores');
console.log('Onderzoek scores at position:', onderzoekPos);

if (onderzoekPos !== -1) {
  // Find the table after this heading
  const tableStart = xml.indexOf('<w:tbl', onderzoekPos);
  console.log('Table starts at:', tableStart);

  if (tableStart !== -1) {
    // Find end of table
    const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;
    console.log('Table ends at:', tableEnd);

    // Get next 2000 chars after the table
    const afterTable = xml.substring(tableEnd, tableEnd + 2000);

    // Extract all paragraphs
    const paragraphs = afterTable.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

    console.log('\n=== Content after Onderzoek scores table (first 10 paragraphs) ===\n');

    if (paragraphs) {
      paragraphs.slice(0, 10).forEach((p, i) => {
        // Get style
        const styleMatch = p.match(/pStyle w:val="([^"]+)"/);
        const style = styleMatch ? styleMatch[1] : '(no style)';

        // Get text
        const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '(empty)';

        console.log(`${i + 1}. [${style}] "${text.substring(0, 80)}"`);
      });
    } else {
      console.log('No paragraphs found after table');
    }

    // Check if there's a "Bevindingen" in the next 5000 chars
    const next5000 = xml.substring(tableEnd, tableEnd + 5000);
    if (next5000.includes('Bevindingen')) {
      console.log('\n⚠ "Bevindingen" found within 5000 chars after the table');
      const bevPos = next5000.indexOf('Bevindingen');
      console.log('Position relative to table end:', bevPos);
    } else {
      console.log('\n✓ No "Bevindingen" found within 5000 chars after the table');
    }
  }
}