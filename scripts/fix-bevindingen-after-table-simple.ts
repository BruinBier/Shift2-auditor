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

console.log('=== Fixing Bevindingen after Onderzoek scores table ===\n');

// Find the scores table by looking for "18/ 30" (the total in your table)
const tableMarker = '18/ 30';
const markerPos = xml.indexOf(tableMarker);

if (markerPos === -1) {
  console.log('Could not find table marker "18/ 30"');
  process.exit(1);
}

console.log('Found table marker at:', markerPos);

// Find the end of the table after this marker
const tableEnd = xml.indexOf('</w:tbl>', markerPos) + '</w:tbl>'.length;
console.log('Table ends at:', tableEnd);

// Find the next "Bevindingen" after the table
const bevPos = xml.indexOf('Bevindingen', tableEnd);

if (bevPos === -1 || bevPos - tableEnd > 5000) {
  console.log('Could not find Bevindingen close after table');
  process.exit(1);
}

console.log('Found Bevindingen at:', bevPos, '(distance:', bevPos - tableEnd, 'chars)');

// Get the paragraph containing Bevindingen
const pStart = Math.max(
  xml.lastIndexOf('<w:p ', bevPos),
  xml.lastIndexOf('<w:p>', bevPos)
);
const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;
const paragraph = xml.substring(pStart, pEnd);

console.log('\nCurrent paragraph:');
console.log(paragraph.substring(0, 300));

const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
const currentStyle = styleMatch ? styleMatch[1] : '(no style)';
console.log('\nCurrent style:', currentStyle);

if (currentStyle === 'Kop2') {
  console.log('✓ Already Kop2, no changes needed');
} else {
  // Change to Kop2
  let newParagraph = paragraph;

  if (styleMatch) {
    // Replace existing style
    newParagraph = newParagraph.replace(/pStyle w:val="[^"]+"/, 'pStyle w:val="Kop2"');
  } else {
    // Add style
    newParagraph = newParagraph.replace(/<w:pPr>/, '<w:pPr><w:pStyle w:val="Kop2"/>');
    if (!newParagraph.includes('<w:pPr>')) {
      // No pPr, add it after <w:p>
      newParagraph = newParagraph.replace(/(<w:p[^>]*>)/, '$1<w:pPr><w:pStyle w:val="Kop2"/></w:pPr>');
    }
  }

  console.log('\nNew paragraph:');
  console.log(newParagraph.substring(0, 300));

  // Replace
  xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Changed Bevindingen to Kop2');
  console.log('✓ Template updated successfully');
}