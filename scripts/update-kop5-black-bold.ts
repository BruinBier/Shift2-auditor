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

console.log('=== Updating Kop5 to black and bold ===\n');

// Find Kop5 style definition
const kop5Match = styles.match(/<w:style[^>]*w:styleId="Kop5"[^>]*>[\s\S]*?<\/w:style>/);

if (!kop5Match) {
  console.log('ERROR: Kop5 style not found in styles.xml');
  process.exit(1);
}

console.log('Found Kop5 style definition');

// Update Kop5 style: black color and bold
const updatedStyles = styles.replace(
  /<w:style([^>]*w:styleId="Kop5"[^>]*)>([\s\S]*?)<\/w:style>/,
  (match, styleAttrs, styleContent) => {
    let updated = styleContent;

    // Change color to black (000000) - replace existing color or add if not present
    if (updated.includes('<w:color')) {
      updated = updated.replace(/<w:color w:val="[^"]+"/g, '<w:color w:val="000000"');
    } else {
      // Add color after w:rPr opening tag
      updated = updated.replace(/(<w:rPr>)/, '$1<w:color w:val="000000"/>');
    }

    // Ensure bold is present
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

console.log('\n✓ Kop5 updated to black and bold');
console.log('\nPlease close Word completely and reopen the template to see the changes.');