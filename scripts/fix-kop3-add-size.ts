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

console.log('=== Adding font size to Kop3 (16px = 32 half-points) ===\n');

// Find Kop3 style definition and add w:sz if not present
const updatedStyles = styles.replace(
  /<w:style([^>]*w:styleId="Kop3"[^>]*)>([\s\S]*?)<\/w:style>/,
  (match, styleAttrs, styleContent) => {
    // Check if w:sz already exists
    if (styleContent.includes('<w:sz')) {
      // Replace existing
      const updated = styleContent
        .replace(/<w:sz w:val="\d+"/g, '<w:sz w:val="32"')
        .replace(/<w:szCs w:val="\d+"/g, '<w:szCs w:val="32"');
      return `<w:style${styleAttrs}>${updated}</w:style>`;
    } else {
      // Add w:sz tags to w:rPr section
      const updated = styleContent.replace(
        /(<w:rPr>)/,
        '$1<w:sz w:val="32"/><w:szCs w:val="32"/>'
      );
      return `<w:style${styleAttrs}>${updated}</w:style>`;
    }
  }
);

// Update ZIP
zip.file('word/styles.xml', updatedStyles);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('✓ Kop3 font size set to 16px (32 half-points)');
console.log('\nPlease close Word completely and reopen the template to see the changes.');