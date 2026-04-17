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

console.log('=== Updating Kop3 font size to 16px (32 half-points) ===\n');

// Find Kop3 style definition
const kop3Match = styles.match(/<w:style[^>]*w:styleId="Kop3"[^>]*>[\s\S]*?<\/w:style>/);

if (!kop3Match) {
  console.log('ERROR: Kop3 style not found in styles.xml');
  process.exit(1);
}

console.log('Found Kop3 style definition');
console.log('Current definition preview:', kop3Match[0].substring(0, 300));

// Update font size (w:sz) to 32 (16px = 16pt = 32 half-points)
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

console.log('\n✓ Kop3 font size updated to 16px (32 half-points)');
console.log('\nPlease close Word completely and reopen the template to see the changes.');