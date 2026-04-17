import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking "Inhoud" spacing ===\n');

// Find "Inhoud" paragraph
const inhoudMatch = xml.match(/(<w:p[^>]*>.*?<w:pStyle w:val="Kop2".*?>.*?<w:t>Inhoud<\/w:t>.*?<\/w:p>)/s);

if (inhoudMatch) {
  console.log('Found "Inhoud" paragraph:\n');
  console.log(inhoudMatch[0].substring(0, 500));
  console.log('\n---\n');

  // Check for spacing
  const hasSpacingAfter = inhoudMatch[0].match(/<w:spacing[^>]*w:after="(\d+)"/);
  const hasSpacingBefore = inhoudMatch[0].match(/<w:spacing[^>]*w:before="(\d+)"/);
  const hasSpacingLine = inhoudMatch[0].match(/<w:spacing[^>]*w:line="(\d+)"/);

  console.log('Current spacing:');
  console.log(`  Before: ${hasSpacingBefore ? hasSpacingBefore[1] + ' twips' : 'none'}`);
  console.log(`  After: ${hasSpacingAfter ? hasSpacingAfter[1] + ' twips' : 'none'}`);
  console.log(`  Line: ${hasSpacingLine ? hasSpacingLine[1] + ' twips' : 'none'}`);
  console.log('\nNote: 1 line = ~240 twips, 12pt = ~240 twips');
} else {
  console.log('ERROR: Inhoud paragraph not found');
}