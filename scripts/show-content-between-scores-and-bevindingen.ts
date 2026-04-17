import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find Onderzoek scores section (Kop3)
const onderzoekScores = xml.indexOf('Onderzoek scores');
console.log('Onderzoek scores at:', onderzoekScores);

// Find the Bevindingen Kop2 (the second one, not in TOC)
const bevindingen = xml.indexOf('Bevindingen', 100000); // Skip TOC
console.log('Bevindingen Kop2 at:', bevindingen);

// Extract the section between them
const between = xml.substring(onderzoekScores, bevindingen);

console.log('\n=== Content between Onderzoek scores and Bevindingen ===');
console.log('Length:', between.length, 'chars\n');

// Extract all text elements
const textMatches = between.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

if (textMatches) {
  console.log('Text content:');
  textMatches.forEach((m, i) => {
    const text = m.replace(/<[^>]+>/g, '');
    if (text.trim() && text.trim().length > 2) {
      console.log(`  ${i + 1}. "${text}"`);
    }
  });
}

// Check if there's a "Bevindingen" in this section
if (between.includes('Bevindingen')) {
  console.log('\n⚠ WARNING: "Bevindingen" text found BETWEEN Onderzoek scores and the Bevindingen Kop2!');

  const localPos = between.indexOf('Bevindingen');
  const context = between.substring(Math.max(0, localPos - 500), localPos + 500);

  console.log('\nContext around this "Bevindingen":');
  console.log(context);
}