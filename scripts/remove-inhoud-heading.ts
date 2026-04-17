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
let xml = zip.file('word/document.xml')!.asText();

console.log('=== Removing "Inhoud" H2 heading ===\n');

// Find all paragraphs with "Inhoud" text
let pos = 0;
let removed = false;

while ((pos = xml.indexOf('>Inhoud<', pos)) !== -1) {
  console.log(`Found "Inhoud" at position: ${pos}`);

  // Find the paragraph containing this
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Check if this is a Kop2 or Heading2 style
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`  Style: ${style}`);

  if (style === 'Kop2' || style === 'Heading2') {
    console.log('  → This is the H2 heading - REMOVING');

    // Remove this entire paragraph
    xml = xml.substring(0, pStart) + xml.substring(pEnd);

    removed = true;
    console.log('  ✓ Removed "Inhoud" heading');
    break; // Only remove the first one
  } else {
    console.log('  → Not a heading, skipping');
  }

  pos++;
}

if (removed) {
  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ "Inhoud" heading removed from template');
} else {
  console.log('\n⚠ No "Inhoud" heading found to remove');
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');