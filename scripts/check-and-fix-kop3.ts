import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

// Load template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Get styles.xml
const stylesXml = zip.file('word/styles.xml');
if (!stylesXml) {
  console.log('ERROR: styles.xml not found');
  process.exit(1);
}

let styles = stylesXml.asText();

console.log('=== Checking current Kop3 font size ===\n');

// Find Kop3 style definition
const kop3Match = styles.match(/<w:style[^>]*w:styleId="Kop3"[^>]*>[\s\S]*?<\/w:style>/);

if (!kop3Match) {
  console.log('ERROR: Kop3 style not found in styles.xml');
  process.exit(1);
}

console.log('Found Kop3 style definition:\n');
console.log(kop3Match[0]);

// Extract current font sizes
const szMatches = kop3Match[0].match(/<w:sz w:val="(\d+)"/g);
const szCsMatches = kop3Match[0].match(/<w:szCs w:val="(\d+)"/g);

console.log('\nCurrent font sizes in Kop3:');
if (szMatches) {
  szMatches.forEach(match => console.log('  ' + match));
} else {
  console.log('  No w:sz found');
}
if (szCsMatches) {
  szCsMatches.forEach(match => console.log('  ' + match));
} else {
  console.log('  No w:szCs found');
}

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log('\nCreated backup:', backupPath);

// Update font size to 32 (16px = 16pt = 32 half-points)
console.log('\n=== Updating Kop3 to 16px (32 half-points) ===\n');

const updatedStyles = styles.replace(
  /<w:style([^>]*w:styleId="Kop3"[^>]*)>([\s\S]*?)<\/w:style>/,
  (match, styleAttrs, styleContent) => {
    // Replace any existing w:sz values within this style
    const updated = styleContent
      .replace(/<w:sz w:val="\d+"/g, '<w:sz w:val="32"')
      .replace(/<w:szCs w:val="\d+"/g, '<w:szCs w:val="32"');

    return `<w:style${styleAttrs}>${updated}</w:style>`;
  }
);

// Update ZIP
zip.file('word/styles.xml', updatedStyles);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Kop3 font size updated to 16px (32 half-points)');
console.log('\nPlease close Word completely and reopen the template to see the changes.');