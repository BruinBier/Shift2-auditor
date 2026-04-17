import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding existing Kop2 headings in template ===\n');

// Find all paragraphs with Kop2 style
const kop2Regex = /<w:p[^>]*>[\s\S]*?<w:pStyle w:val="Kop2"[\s\S]*?<\/w:p>/g;
const matches = xml.match(kop2Regex);

if (matches && matches.length > 0) {
  console.log(`Found ${matches.length} Kop2 paragraphs\n`);

  matches.forEach((match, i) => {
    // Extract text from this paragraph
    const textMatches = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ') : '(no text)';

    console.log(`${i + 1}. "${text}"`);

    if (i === 0) {
      // Show full XML of first Kop2 heading as template
      console.log('\n=== First Kop2 heading XML (to use as template) ===');
      console.log(match);
      console.log('\n');
    }
  });

  // Also find a Kop3 heading as example
  console.log('\n=== Finding existing Kop3 headings ===\n');
  const kop3Regex = /<w:p[^>]*>[\s\S]*?<w:pStyle w:val="Kop3"[\s\S]*?<\/w:p>/g;
  const kop3Matches = xml.match(kop3Regex);

  if (kop3Matches && kop3Matches.length > 0) {
    const textMatches = kop3Matches[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const text = textMatches ? textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ') : '(no text)';

    console.log(`Found Kop3: "${text}"`);
    console.log('\n=== First Kop3 heading XML ===');
    console.log(kop3Matches[0]);
  } else {
    console.log('No Kop3 headings found');
  }
} else {
  console.log('No Kop2 headings found!');
}