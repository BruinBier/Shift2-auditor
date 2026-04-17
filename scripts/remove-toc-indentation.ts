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
let stylesXml = zip.file('word/styles.xml')!.asText();

console.log('=== Removing TOC indentation ===\n');

let changesCount = 0;

// Remove indentation from Inhopg2 (change w:left="240" to w:left="0")
if (stylesXml.includes('w:styleId="Inhopg2"')) {
  const inhopg2Pattern = /(<w:style[^>]*w:styleId="Inhopg2"[^>]*>.*?<w:ind w:left=")(\d+)(".*?<\/w:style>)/s;
  const match = stylesXml.match(inhopg2Pattern);

  if (match) {
    console.log(`Inhopg2: ${match[2]} twips → 0 twips`);
    stylesXml = stylesXml.replace(inhopg2Pattern, '$1' + '0' + '$3');
    changesCount++;
  }
}

// Remove indentation from Inhopg3 (change w:left="480" to w:left="0")
if (stylesXml.includes('w:styleId="Inhopg3"')) {
  const inhopg3Pattern = /(<w:style[^>]*w:styleId="Inhopg3"[^>]*>.*?<w:ind w:left=")(\d+)(".*?<\/w:style>)/s;
  const match = stylesXml.match(inhopg3Pattern);

  if (match) {
    console.log(`Inhopg3: ${match[2]} twips → 0 twips`);
    stylesXml = stylesXml.replace(inhopg3Pattern, '$1' + '0' + '$3');
    changesCount++;
  }
}

if (changesCount > 0) {
  // Update ZIP
  zip.file('word/styles.xml', stylesXml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log(`\n✓ Removed indentation from ${changesCount} TOC style(s)`);
  console.log('  All TOC entries will now align with the "I" of "Inhoud"');
} else {
  console.log('\n⚠ No changes made');
}