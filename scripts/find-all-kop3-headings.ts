import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding all Kop3 and Heading3 paragraphs ===\n');

// Find all paragraphs with Kop3 or Heading3
const paragraphs = xml.match(/<w:p[^>]*>.*?<\/w:p>/gs) || [];

let count = 0;

paragraphs.forEach((p, index) => {
  if (p.includes('pStyle w:val="Kop3"') || p.includes('pStyle w:val="Heading3"')) {
    count++;

    // Extract text
    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('') : '(no text)';

    console.log(`${count}. ${text.substring(0, 80)}`);

    // Show first 300 chars of paragraph
    if (text.includes('Resultaten') || text.includes('succecriterium')) {
      console.log('   (First 400 chars of paragraph):');
      console.log('   ' + p.substring(0, 400));
      console.log('');
    }
  }
});

console.log(`\nTotal Kop3/Heading3 headings: ${count}`);