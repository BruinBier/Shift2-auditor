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

// Find Bevindingen heading (should be Kop2/Heading2)
let searchPos = 0;
let bevHeadingEnd = -1;

while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
    // Find end of this paragraph
    bevHeadingEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;
    console.log('Found Bevindingen heading (Kop2)');
    break;
  }
  searchPos++;
}

if (bevHeadingEnd === -1) {
  console.error('Bevindingen heading not found!');
  process.exit(1);
}

// Create example criterion paragraph with Kop3 style
const exampleCriterion = `<w:p w14:paraId="0C497706" w14:textId="77777777" w:rsidR="00280895" w:rsidRPr="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r w:rsidRPr="00280895"><w:t>1.3.3 Zintuiglijke eigenschappen A</w:t></w:r></w:p>`;

// Find the next section (Opmerkingen) to insert before it
const nextSectionMarker = 'Opmerkingen';
let nextSectionPos = xml.indexOf(nextSectionMarker, bevHeadingEnd);

if (nextSectionPos === -1) {
  console.error('Could not find Opmerkingen section');
  process.exit(1);
}

// Find start of Opmerkingen paragraph
const beforeNextSection = xml.substring(nextSectionPos - 1000, nextSectionPos);
const lastPStart = Math.max(
  beforeNextSection.lastIndexOf('<w:p '),
  beforeNextSection.lastIndexOf('<w:p>')
);
const nextSectionStart = nextSectionPos - 1000 + lastPStart;

console.log('Inserting example criterion after Bevindingen heading...');

// Insert the example criterion between Bevindingen heading and Opmerkingen section
xml = xml.substring(0, bevHeadingEnd) + exampleCriterion + xml.substring(nextSectionStart);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template updated successfully');
console.log('✓ Added "1.3.3 Zintuiglijke eigenschappen A" with Kop3 style under Bevindingen');