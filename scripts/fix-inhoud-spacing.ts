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

console.log('=== Adjusting "Inhoud" spacing ===\n');

// Find the TOC SDT
const sdtStart = xml.indexOf('<w:sdt>');

// Find "Inhoud" paragraph just before TOC
const beforeToc = xml.substring(Math.max(0, sdtStart - 1000), sdtStart);
const inhoudMatch = beforeToc.match(/(<w:p[^>]*>.*?<w:t>Inhoud<\/w:t>.*?<\/w:p>)/s);

if (!inhoudMatch) {
  console.log('ERROR: Inhoud paragraph not found before TOC');
  process.exit(1);
}

const inhoudParagraph = inhoudMatch[1];
console.log('Found "Inhoud" paragraph before TOC');
console.log('Current paragraph (first 300 chars):');
console.log(inhoudParagraph.substring(0, 300));

// Check current spacing
const hasSpacing = inhoudParagraph.includes('<w:spacing');
console.log(`\nCurrent spacing: ${hasSpacing ? 'Present' : 'None'}`);

// Add or modify spacing to reduce gap after "Inhoud"
let updatedParagraph = inhoudParagraph;

if (hasSpacing) {
  // Update existing spacing
  updatedParagraph = updatedParagraph.replace(
    /<w:spacing[^>]*\/>/,
    '<w:spacing w:after="120" w:line="276" w:lineRule="auto"/>'
  );
  console.log('Updated existing spacing');
} else {
  // Add spacing to paragraph properties
  if (updatedParagraph.includes('<w:pPr>')) {
    updatedParagraph = updatedParagraph.replace(
      /<w:pPr>/,
      '<w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/>'
    );
  } else {
    // Add pPr if not exists
    updatedParagraph = updatedParagraph.replace(
      /(<w:p[^>]*>)/,
      '$1<w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>'
    );
  }
  console.log('Added spacing properties');
}

// Find position in full XML and replace
const inhoudPosition = xml.lastIndexOf(inhoudParagraph, sdtStart);
if (inhoudPosition !== -1) {
  xml = xml.substring(0, inhoudPosition) +
        updatedParagraph +
        xml.substring(inhoudPosition + inhoudParagraph.length);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Spacing adjusted');
  console.log('  After: 120 twips (~6pt, reduced from default)');
  console.log('  This should bring "Inhoud" closer to the TOC entries');
} else {
  console.log('\nERROR: Could not find paragraph position in XML');
}