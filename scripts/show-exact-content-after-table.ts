import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding EXACT content after Onderzoek scores table ===\n');

// Find "Onderzoek scores" heading
const onderzoekPos = xml.indexOf('Onderzoek scores');

// Find table after it
const tableStart = xml.indexOf('<w:tbl', onderzoekPos);
const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

console.log('Table ends at position:', tableEnd);

// Get 3000 chars after table
const after = xml.substring(tableEnd, tableEnd + 3000);

// Extract paragraphs
const paragraphs = after.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

console.log('\nFirst 15 paragraphs after table:\n');

if (paragraphs) {
  paragraphs.slice(0, 15).forEach((p, i) => {
    const styleMatch = p.match(/pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : '(no style)';

    const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '(empty)';

    if (text.trim()) {
      const mark = text.includes('Bevindingen') ? ' ← THIS ONE!' : '';
      console.log(`${i + 1}. [${style}] "${text.substring(0, 60)}"${mark}`);

      if (text.includes('Bevindingen')) {
        console.log(`   → Position: ${tableEnd + after.indexOf(p)}`);
        console.log(`   → Current style: ${style}`);
        console.log(`   → Target style: Kop2`);
      }
    }
  });
}

// Check if "Bevindingen" appears in first 3000 chars after table
if (after.includes('Bevindingen')) {
  const localPos = after.indexOf('Bevindingen');
  console.log('\n✓ "Bevindingen" found', localPos, 'chars after table');
} else {
  console.log('\n✗ No "Bevindingen" in first 3000 chars after table');
  console.log('The Bevindingen heading must be further away...');
}