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

// Get styles.xml
const stylesXml = zip.file('word/styles.xml');
if (!stylesXml) {
  console.log('ERROR: styles.xml not found');
  process.exit(1);
}

let styles = stylesXml.asText();

console.log('=== Updating Kop4 font size to 14px (28 half-points) ===\n');

// Find Kop4 style definition
const kop4Match = styles.match(/<w:style[^>]*w:styleId="Kop4"[^>]*>[\s\S]*?<\/w:style>/);

if (!kop4Match) {
  console.log('ERROR: Kop4 style not found in styles.xml');
  process.exit(1);
}

console.log('Found Kop4 style definition');
console.log('Current definition preview:', kop4Match[0].substring(0, 300));

// Update font size (w:sz) to 28 (14px = 14pt = 28 half-points)
const updatedStyles = styles.replace(
  /<w:style([^>]*w:styleId="Kop4"[^>]*)>([\s\S]*?)<\/w:style>/,
  (match, styleAttrs, styleContent) => {
    // Replace any existing w:sz values within this style
    const updated = styleContent
      .replace(/<w:sz w:val="\d+"/g, '<w:sz w:val="28"')
      .replace(/<w:szCs w:val="\d+"/g, '<w:szCs w:val="28"');

    return `<w:style${styleAttrs}>${updated}</w:style>`;
  }
);

// Update ZIP
zip.file('word/styles.xml', updatedStyles);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Kop4 font size updated to 14px (28 half-points)');
console.log('\nPlease close Word completely and reopen the template to see the changes.');