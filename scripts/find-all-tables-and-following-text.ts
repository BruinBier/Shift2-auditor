import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding all tables and what follows them ===\n');

// Find all tables
let pos = 0;
let tableCount = 0;

while ((pos = xml.indexOf('<w:tbl', pos)) !== -1) {
  tableCount++;

  const tableEnd = xml.indexOf('</w:tbl>', pos) + '</w:tbl>'.length;

  // Get text before table to identify which table this is
  const before = xml.substring(Math.max(0, pos - 1000), pos);
  const beforeTexts = before.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  const context = beforeTexts ? beforeTexts.slice(-3).map(m => m.replace(/<[^>]+>/g, '')).join(' → ') : '';

  // Get first 1000 chars after table
  const after = xml.substring(tableEnd, tableEnd + 1000);
  const afterParagraphs = after.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

  console.log(`\n=== TABLE ${tableCount} ===`);
  console.log(`Context before: ...${context}`);
  console.log(`Table ends at: ${tableEnd}`);
  console.log('First 5 paragraphs after table:');

  if (afterParagraphs) {
    afterParagraphs.slice(0, 5).forEach((p, i) => {
      const styleMatch = p.match(/pStyle w:val="([^"]+)"/);
      const style = styleMatch ? styleMatch[1] : '(no style)';

      const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '(empty)';

      if (text.trim()) {
        const mark = text.includes('Bevindingen') ? ' ← BEVINDINGEN HERE!' : '';
        console.log(`  ${i + 1}. [${style}] "${text.substring(0, 60)}"${mark}`);
      }
    });
  }

  // Check if Bevindingen is within 2000 chars after this table
  if (after.includes('Bevindingen') || xml.substring(tableEnd, tableEnd + 2000).includes('Bevindingen')) {
    console.log('\n  ⭐ THIS TABLE IS FOLLOWED BY "Bevindingen"!');

    const bevPos = xml.indexOf('Bevindingen', tableEnd);
    const distance = bevPos - tableEnd;
    console.log(`  → Bevindingen is ${distance} chars after this table`);

    // Get the paragraph
    const pStart = Math.max(
      xml.lastIndexOf('<w:p ', bevPos),
      xml.lastIndexOf('<w:p>', bevPos)
    );
    const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;
    const bevParagraph = xml.substring(pStart, pEnd);

    const bevStyleMatch = bevParagraph.match(/pStyle w:val="([^"]+)"/);
    const bevStyle = bevStyleMatch ? bevStyleMatch[1] : '(no style)';

    console.log(`  → Current style of Bevindingen: ${bevStyle}`);
    console.log(`  → Paragraph starts at: ${pStart}`);
    console.log(`  → Paragraph ends at: ${pEnd}`);
  }

  pos = tableEnd;
}

console.log(`\n\nTotal tables found: ${tableCount}`);