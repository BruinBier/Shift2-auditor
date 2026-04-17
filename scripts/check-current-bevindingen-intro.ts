import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find Bevindingen heading
let searchPos = 0;
while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('Heading2') || before.includes('Kop2')) {
    console.log('Found Bevindingen heading in current template');

    // Find end of heading paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + 6;

    // Find next Kop3 (first criterion)
    const nextKop3 = xml.indexOf('pStyle w:val="Kop3"', headingEnd);
    if (nextKop3 === -1) {
      console.log('No Kop3 found after Bevindingen heading');
      break;
    }

    const nextKop3Start = xml.lastIndexOf('<w:p', nextKop3);

    // Extract text between
    const between = xml.substring(headingEnd, nextKop3Start);

    console.log('\nContent between Bevindingen heading and first criterion:');
    console.log('Length:', between.length, 'chars');

    const textMatches = between.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

    if (textMatches && textMatches.some(m => m.replace(/<[^>]+>/g, '').trim())) {
      console.log('\nText content:');
      textMatches.forEach(m => {
        const text = m.replace(/<[^>]+>/g, '');
        if (text.trim()) {
          console.log(`  "${text}"`);
        }
      });
    } else {
      console.log('\n(No text - only empty paragraphs or formatting)');
    }

    // Save the "between" content for analysis
    fs.writeFileSync('bevindingen-intro-section.xml', between);
    console.log('\nSaved section to bevindingen-intro-section.xml');

    break;
  }
  searchPos++;
}