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

console.log('=== Updating Kop5 font size to 12px (24 half-points) ===\n');

// Find Kop5 style definition
const kop5Match = styles.match(/<w:style[^>]*w:styleId="Kop5"[^>]*>[\s\S]*?<\/w:style>/);

if (kop5Match) {
  console.log('Found Kop5 style definition');
  console.log('Current definition preview:', kop5Match[0].substring(0, 300));

  // Update font size (w:sz) to 24 (12px = 12pt = 24 half-points)
  const updatedStyles = styles.replace(
    /<w:style([^>]*w:styleId="Kop5"[^>]*)>([\s\S]*?)<\/w:style>/,
    (match, styleAttrs, styleContent) => {
      // Check if w:sz already exists
      if (styleContent.includes('<w:sz')) {
        // Replace existing
        const updated = styleContent
          .replace(/<w:sz w:val="\d+"/g, '<w:sz w:val="24"')
          .replace(/<w:szCs w:val="\d+"/g, '<w:szCs w:val="24"');
        return `<w:style${styleAttrs}>${updated}</w:style>`;
      } else {
        // Add w:sz tags to w:rPr section
        const updated = styleContent.replace(
          /(<w:rPr>)/,
          '$1<w:sz w:val="24"/><w:szCs w:val="24"/>'
        );
        return `<w:style${styleAttrs}>${updated}</w:style>`;
      }
    }
  );

  // Update ZIP
  zip.file('word/styles.xml', updatedStyles);
} else {
  console.log('Kop5 style not found - creating new style definition');

  // Create a new Kop5 style based on common Word heading structure
  const newKop5Style = `<w:style w:type="paragraph" w:styleId="Kop5"><w:name w:val="heading 5"/><w:basedOn w:val="Standaard"/><w:next w:val="Standaard"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="120" w:after="40"/><w:outlineLvl w:val="4"/></w:pPr><w:rPr><w:rFonts w:eastAsia="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="8F1CFF"/></w:rPr></w:style>`;

  // Insert before </w:styles> closing tag
  const updatedStyles = styles.replace('</w:styles>', newKop5Style + '</w:styles>');

  // Update ZIP
  zip.file('word/styles.xml', updatedStyles);
}

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Kop5 font size set to 12px (24 half-points)');
console.log('\nPlease close Word completely and reopen the template to see the changes.');