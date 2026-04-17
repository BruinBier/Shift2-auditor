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

console.log('=== Finding Bevindingen after Onderzoek scores table ===\n');

// Find "Onderzoek scores" heading
const onderzoekPos = xml.indexOf('Onderzoek scores');
console.log('Onderzoek scores at:', onderzoekPos);

// Find the table
const tableStart = xml.indexOf('<w:tbl', onderzoekPos);
const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

console.log('Table ends at:', tableEnd);

// Find "Bevindingen" that comes AFTER the table (not before)
let bevPos = xml.indexOf('Bevindingen', tableEnd);

if (bevPos === -1) {
  console.log('No Bevindingen found after table, checking entire document...');

  // List all Bevindingen
  let pos = 0;
  let count = 0;
  while ((pos = xml.indexOf('Bevindingen', pos)) !== -1) {
    count++;
    console.log(`  ${count}. Position ${pos}, relative to table: ${pos - tableEnd > 0 ? '+' : ''}${pos - tableEnd}`);
    pos++;
  }

  process.exit(1);
}

console.log('Found Bevindingen at:', bevPos, '(', bevPos - tableEnd, 'chars after table)');

// Get the paragraph
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', bevPos),
  xml.lastIndexOf('<w:p>', bevPos)
);
const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;

const oldParagraph = xml.substring(pStart, pEnd);

// Check current style
const styleMatch = oldParagraph.match(/pStyle w:val="([^"]+)"/);
const currentStyle = styleMatch ? styleMatch[1] : '(no style)';

console.log('\nCurrent paragraph style:', currentStyle);
console.log('Paragraph preview:', oldParagraph.substring(0, 200));

// If it's NOT Kop2, change it
if (currentStyle !== 'Kop2') {
  console.log('\n✓ Changing style from', currentStyle, 'to Kop2');

  // Replace the style
  let newParagraph = oldParagraph;
  if (styleMatch) {
    newParagraph = newParagraph.replace(/pStyle w:val="[^"]+"/, 'pStyle w:val="Kop2"');
  } else {
    // Add pStyle
    newParagraph = newParagraph.replace(/<w:pPr>/, '<w:pPr><w:pStyle w:val="Kop2"/>');
  }

  // Replace in XML
  xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('✓ Template updated successfully');
} else {
  console.log('\n✓ Bevindingen already has Kop2 style, no changes needed');
}