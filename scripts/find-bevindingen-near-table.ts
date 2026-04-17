import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding all Bevindingen ===\n');

// Find all "Bevindingen"
let pos = 0;
let count = 0;
const results: any[] = [];

while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
  count++;

  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  // Get nearby text
  const before = xml.substring(Math.max(0, pos - 500), pos);
  const nearbyTexts = before.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  const context = nearbyTexts ? nearbyTexts.slice(-5).map(m => m.replace(/<[^>]+>/g, '')).join(' ') : '';

  results.push({
    position: pos,
    style,
    context,
    paragraph: paragraph.substring(0, 200)
  });

  console.log(`${count}. Position: ${pos}`);
  console.log(`   Style: ${style}`);
  console.log(`   Context: ...${context}`);
  console.log();

  pos++;
}

console.log(`Total: ${count} Bevindingen found`);

// Now find which one is close after a table
console.log('\n=== Checking which Bevindingen comes after a table ===\n');

results.forEach((r, i) => {
  // Look back from this Bevindingen position to find nearest table
  const before = xml.substring(Math.max(0, r.position - 10000), r.position);
  const lastTableEnd = before.lastIndexOf('</w:tbl>');

  if (lastTableEnd !== -1) {
    const distance = before.length - lastTableEnd;
    console.log(`Bevindingen ${i + 1} is ${distance} chars after last table`);

    if (distance < 2000) {
      console.log(`  → This is likely the one right after the Onderzoek scores table!`);
      console.log(`  → Current style: ${r.style}`);
      console.log(`  → Needs to be: Kop2`);
    }
  }
});