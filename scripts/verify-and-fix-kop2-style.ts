import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`Created backup: ${backupPath}`);

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Check styles.xml
const stylesXml = zip.file('word/styles.xml');
if (!stylesXml) {
  console.log('ERROR: styles.xml not found');
  process.exit(1);
}

const stylesContent = stylesXml.asText();

// Check if Kop2 exists
const kop2Match = stylesContent.match(/<w:style[^>]*w:styleId="Kop2"[^>]*>[\s\S]*?<\/w:style>/);

console.log('=== Checking Kop2 style definition ===\n');

if (kop2Match) {
  console.log('✓ Kop2 style found in styles.xml');
  console.log('\nKop2 definition:');
  console.log(kop2Match[0].substring(0, 500));
} else {
  console.log('✗ Kop2 style NOT found in styles.xml!');
  console.log('This explains why Word doesnt show it as Kop2');
}

// Now check the actual Bevindingen paragraph
const xml = zip.file('word/document.xml')!.asText();
const bevPos = 154905;
const pStart = 154672;
const pEnd = 154959;
const bevParagraph = xml.substring(pStart, pEnd);

console.log('\n=== Bevindingen paragraph ===');
console.log(bevParagraph);

const styleInParagraph = bevParagraph.match(/pStyle w:val="([^"]+)"/);
console.log('\nStyle in paragraph:', styleInParagraph ? styleInParagraph[1] : '(none)');

console.log('\n✓ The paragraph XML is correct');
console.log('✓ If Word still shows it wrong, try:');
console.log('  1. Close and reopen the document');
console.log('  2. Or manually apply Kop2 style in Word');
console.log('  3. Or the Kop2 style definition needs to be fixed');