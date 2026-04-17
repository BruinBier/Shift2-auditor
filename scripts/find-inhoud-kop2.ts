import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding "Inhoud" Kop2 heading ===\n');

// Find the TOC SDT
const sdtStart = xml.indexOf('<w:sdt>');
console.log('TOC starts at position:', sdtStart);

// Search in the 2000 characters before TOC
const beforeToc = xml.substring(Math.max(0, sdtStart - 2000), sdtStart);

// Find all paragraphs with "Inhoud"
let pos = 0;
let foundCount = 0;

while ((pos = beforeToc.indexOf('Inhoud', pos)) !== -1) {
  foundCount++;
  console.log(`\nFound "Inhoud" #${foundCount} at offset ${pos} from search start`);

  // Get context
  const context = beforeToc.substring(Math.max(0, pos - 200), Math.min(beforeToc.length, pos + 200));

  // Check if it's Kop2
  if (context.includes('pStyle w:val="Kop2"')) {
    console.log('  ✓ This is a Kop2 heading!');
    console.log('  Context:');
    console.log('  ' + context.substring(0, 400));
  } else {
    console.log('  Not a Kop2 heading');
  }

  pos++;
}

console.log(`\n\nTotal "Inhoud" occurrences found before TOC: ${foundCount}`);