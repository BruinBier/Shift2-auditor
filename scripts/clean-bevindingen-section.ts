import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`Created backup: ${backupPath}`);

// Load template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml')!.asText();

// Find Bevindingen heading
let searchPos = 0;
let bevHeadingStart = -1;
let bevHeadingEnd = -1;

while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
    // Find start of this paragraph
    const pStart = xml.lastIndexOf('<w:p ', searchPos);
    const pStart2 = xml.lastIndexOf('<w:p>', searchPos);
    bevHeadingStart = Math.max(pStart, pStart2);

    // Find end of this paragraph
    bevHeadingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;

    console.log('Found Bevindingen heading');
    console.log('Starts at:', bevHeadingStart);
    console.log('Ends at:', bevHeadingEnd);

    break;
  }
  searchPos++;
}

if (bevHeadingStart === -1) {
  console.error('Bevindingen heading not found!');
  process.exit(1);
}

// Find the next section heading (Opmerkingen or Borging en vervolg)
const nextSectionMarker = 'Opmerkingen';
let nextSectionPos = xml.indexOf(nextSectionMarker, bevHeadingEnd);

if (nextSectionPos === -1) {
  nextSectionPos = xml.indexOf('Borging en vervolg', bevHeadingEnd);
}

if (nextSectionPos === -1) {
  console.error('Could not find end of Bevindingen section');
  process.exit(1);
}

// Find start of next section heading paragraph
const beforeNextSection = xml.substring(nextSectionPos - 1000, nextSectionPos);
const lastPStart = Math.max(
  beforeNextSection.lastIndexOf('<w:p '),
  beforeNextSection.lastIndexOf('<w:p>')
);
const nextSectionStart = nextSectionPos - 1000 + lastPStart;

console.log('Next section starts at:', nextSectionStart);

// Extract what's in between
const betweenSection = xml.substring(bevHeadingEnd, nextSectionStart);
console.log('\nCurrent content between Bevindingen and next section:');
console.log('Length:', betweenSection.length, 'chars');

// Extract any text
const textMatches = betweenSection.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
if (textMatches && textMatches.some(m => m.replace(/<[^>]+>/g, '').trim())) {
  console.log('Found text:');
  textMatches.forEach(m => {
    const text = m.replace(/<[^>]+>/g, '');
    if (text.trim()) {
      console.log(`  "${text}"`);
    }
  });
}

// Replace everything between heading and next section with empty paragraph
console.log('\nRemoving all content between Bevindingen heading and next section...');

// Keep the heading, remove everything else until next section
xml = xml.substring(0, bevHeadingEnd) + xml.substring(nextSectionStart);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template updated successfully');
console.log('✓ All content removed from Bevindingen section (heading preserved)');