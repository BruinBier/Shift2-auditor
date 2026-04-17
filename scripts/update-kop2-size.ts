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

console.log('=== Updating Kop2 font size to 20px (40 half-points) ===\n');

// Find Kop2 style definition
const kop2Match = styles.match(/<w:style[^>]*w:styleId="Kop2"[^>]*>[\s\S]*?<\/w:style>/);

if (!kop2Match) {
  console.log('ERROR: Kop2 style not found in styles.xml');
  process.exit(1);
}

console.log('Found Kop2 style definition');
console.log('Current definition preview:', kop2Match[0].substring(0, 300));

// Update font size (w:sz) to 40 (20px = 40 half-points)
// Word uses half-points, so 20px = 20pt = 40 half-points
const updatedStyles = styles.replace(
  /<w:style([^>]*w:styleId="Kop2"[^>]*)>([\s\S]*?)<\/w:style>/,
  (match, styleAttrs, styleContent) => {
    // Replace any existing w:sz values within this style
    const updated = styleContent
      .replace(/<w:sz w:val="\d+"/g, '<w:sz w:val="40"')
      .replace(/<w:szCs w:val="\d+"/g, '<w:szCs w:val="40"');

    return `<w:style${styleAttrs}>${updated}</w:style>`;
  }
);

// Update ZIP
zip.file('word/styles.xml', updatedStyles);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Kop2 font size updated to 20px (40 half-points)');
console.log('\nPlease close Word completely and reopen the template to see the changes.');