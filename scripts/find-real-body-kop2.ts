import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding all Kop2 paragraphs in document body ===\n');

// Find paragraphs that have pStyle="Kop2" (not Inhopg2)
const regex = /<w:p[^>]*>[\s\S]*?<w:pStyle w:val="Kop2"[^>]*>[\s\S]*?<\/w:p>/g;
const matches = xml.match(regex);

if (matches) {
  console.log(`Found ${matches.length} paragraphs with Kop2 style\n`);

  matches.forEach((match, i) => {
    // Extract text
    const textMatches = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ') : '(no text)';

    console.log(`${i + 1}. "${text.substring(0, 50)}..."`);

    // Show one full example
    if (text.includes('Samenvatting') && match.length < 1000) {
      console.log('\n=== Samenvatting Kop2 (BODY, not TOC) ===');
      console.log(match);
      console.log('\n');
    }
  });
} else {
  console.log('No Kop2 paragraphs found!');
}