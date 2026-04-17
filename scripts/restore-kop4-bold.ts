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

console.log('=== Restoring bold to Kop4 ===\n');

// Find Kop4 style definition
const kop4Match = styles.match(/<w:style[^>]*w:styleId="Kop4"[^>]*>[\s\S]*?<\/w:style>/);

if (!kop4Match) {
  console.log('ERROR: Kop4 style not found in styles.xml');
  process.exit(1);
}

console.log('Found Kop4 style definition');

// Add bold tags to Kop4 style if not present
const updatedStyles = styles.replace(
  /<w:style([^>]*w:styleId="Kop4"[^>]*)>([\s\S]*?)<\/w:style>/,
  (match, styleAttrs, styleContent) => {
    let updated = styleContent;

    // Add bold if not present
    if (!updated.includes('<w:b/>')) {
      updated = updated.replace(/(<w:rPr>)/, '$1<w:b/><w:bCs/>');
    }

    return `<w:style${styleAttrs}>${updated}</w:style>`;
  }
);

// Update ZIP
zip.file('word/styles.xml', updatedStyles);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Kop4 bold restored');
console.log('\nPlease close Word completely and reopen the template to see the changes.');