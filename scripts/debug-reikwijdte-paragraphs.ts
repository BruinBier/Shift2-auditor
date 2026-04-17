import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Analyzing paragraphs around "Reikwijdte en werkwijze" ===\n');

// Find the heading
const headingText = 'Reikwijdte en werkwijze';
const headingPos = xml.indexOf(headingText);

console.log('Found heading at position:', headingPos);

// Find the paragraph containing this heading
const headingPStart = Math.max(
  xml.lastIndexOf('<w:p ', headingPos),
  xml.lastIndexOf('<w:p>', headingPos)
);
const headingPEnd = xml.indexOf('</w:p>', headingPos) + '</w:p>'.length;

console.log('\n=== HEADING PARAGRAPH ===');
console.log(xml.substring(headingPStart, headingPEnd));

// Get text before heading
const beforeText = xml.substring(Math.max(0, headingPStart - 5000), headingPStart);

// Find all paragraphs in this section
const paragraphs: string[] = [];
let searchPos = 0;
while (true) {
  const pStart1 = beforeText.indexOf('<w:p ', searchPos);
  const pStart2 = beforeText.indexOf('<w:p>', searchPos);

  let pStart = -1;
  if (pStart1 === -1 && pStart2 === -1) break;
  if (pStart1 === -1) pStart = pStart2;
  else if (pStart2 === -1) pStart = pStart1;
  else pStart = Math.min(pStart1, pStart2);

  if (pStart === -1) break;

  const pEnd = beforeText.indexOf('</w:p>', pStart);
  if (pEnd === -1) break;

  const paragraph = beforeText.substring(pStart, pEnd + '</w:p>'.length);
  paragraphs.push(paragraph);

  searchPos = pEnd + 1;
}

console.log(`\n=== FOUND ${paragraphs.length} PARAGRAPHS BEFORE HEADING ===\n`);

// Show last 5 paragraphs
const showCount = Math.min(5, paragraphs.length);
for (let i = paragraphs.length - showCount; i < paragraphs.length; i++) {
  const paragraph = paragraphs[i];

  // Extract text
  const hasText = paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  const textContent = hasText ? hasText.map(m => m.replace(/<[^>]+>/g, '')).join('') : '';

  console.log(`\n--- Paragraph ${i + 1} ---`);
  console.log('Text content:', textContent || '(EMPTY)');
  console.log('XML preview:', paragraph.substring(0, 200));
}