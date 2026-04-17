import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding exact paragraph before "Reikwijdte en werkwijze" ===\n');

// Find the heading
const headingText = 'Reikwijdte en werkwijze';
const headingPos = xml.indexOf(headingText);

console.log('Heading position:', headingPos);

// Find the paragraph containing this heading
const headingPStart = Math.max(
  xml.lastIndexOf('<w:p ', headingPos),
  xml.lastIndexOf('<w:p>', headingPos)
);

console.log('Heading paragraph starts at:', headingPStart);

// Get 1000 characters before the heading paragraph
const before = xml.substring(headingPStart - 1000, headingPStart);

console.log('\n=== 1000 chars before heading paragraph ===');
console.log(before);

// Find the immediately previous </w:p>
const prevPEnd = before.lastIndexOf('</w:p>');
if (prevPEnd === -1) {
  console.log('\nNo previous paragraph found');
  process.exit(0);
}

// Find the start of that paragraph
const beforePrev = before.substring(0, prevPEnd);
const prevPStart1 = beforePrev.lastIndexOf('<w:p ');
const prevPStart2 = beforePrev.lastIndexOf('<w:p>');
const prevPStart = Math.max(prevPStart1, prevPStart2);

if (prevPStart === -1) {
  console.log('\nCould not find start of previous paragraph');
  process.exit(0);
}

const prevParagraph = before.substring(prevPStart, prevPEnd + '</w:p>'.length);

console.log('\n=== PREVIOUS PARAGRAPH (immediately before heading) ===');
console.log(prevParagraph);

// Extract text
const textMatches = prevParagraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
const textContent = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('') : '';

console.log('\n=== TEXT CONTENT ===');
console.log(textContent || '(EMPTY - THIS IS THE ONE TO REMOVE!)');

if (!textContent || textContent.trim() === '') {
  console.log('\n✓ This paragraph is empty and should be removed');

  // Calculate absolute position
  const absolutePrevPStart = headingPStart - 1000 + prevPStart;
  const absolutePrevPEnd = headingPStart - 1000 + prevPEnd + '</w:p>'.length;

  console.log('\nAbsolute position in XML:');
  console.log('Start:', absolutePrevPStart);
  console.log('End:', absolutePrevPEnd);
}