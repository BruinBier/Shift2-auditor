import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const stylesXml = zip.file('word/styles.xml');
if (!stylesXml) {
  console.error('styles.xml not found!');
  process.exit(1);
}

const stylesContent = stylesXml.asText();

// Find Kop2 style definition
const kop2Start = stylesContent.indexOf('styleId="Kop2"');
if (kop2Start === -1) {
  console.log('Kop2 style not found!');
  process.exit(1);
}

// Get the full style element
const styleStart = stylesContent.lastIndexOf('<w:style', kop2Start);
const styleEnd = stylesContent.indexOf('</w:style>', kop2Start) + '</w:style>'.length;
const kop2Style = stylesContent.substring(styleStart, styleEnd);

console.log('=== Kop2 Style Definition ===\n');
console.log(kop2Style);

// Also check Kop3
console.log('\n\n=== Kop3 Style Definition ===\n');
const kop3Start = stylesContent.indexOf('styleId="Kop3"');
if (kop3Start !== -1) {
  const style3Start = stylesContent.lastIndexOf('<w:style', kop3Start);
  const style3End = stylesContent.indexOf('</w:style>', kop3Start) + '</w:style>'.length;
  const kop3Style = stylesContent.substring(style3Start, style3End);
  console.log(kop3Style);
} else {
  console.log('Kop3 style not found!');
}

// Save full styles.xml for inspection
fs.writeFileSync('template-styles.xml', stylesContent);
console.log('\n\n✓ Saved full styles.xml to template-styles.xml for inspection');