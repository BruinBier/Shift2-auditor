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

console.log('=== Adding page break before "Samenvatting" (body, not TOC) ===\n');

// Find all occurrences of "Samenvatting"
let pos = 0;
let found = false;

while ((pos = xml.indexOf('<w:t>Samenvatting</w:t>', pos)) !== -1) {
  console.log(`\nFound "Samenvatting" at position: ${pos}`);

  // Find the paragraph containing this
  const pStart = Math.max(
    xml.lastIndexOf('<w:p ', pos),
    xml.lastIndexOf('<w:p>', pos)
  );
  const pEnd = xml.indexOf('</w:p>', pos) + '</w:p>'.length;
  const paragraph = xml.substring(pStart, pEnd);

  // Check if this is in TOC (Inhopg style) or body
  const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : '(no style)';

  console.log(`Style: ${style}`);

  // Skip TOC entries
  if (style.includes('Inhopg')) {
    console.log('→ This is in TOC, skipping');
    pos++;
    continue;
  }

  // This is the body heading!
  console.log('→ This is the body heading!');

  // Check if page break already exists
  if (paragraph.includes('<w:pageBreakBefore/>')) {
    console.log('✓ Page break already exists');
    found = true;
    break;
  }

  // Add page break
  let updatedParagraph = paragraph;

  if (paragraph.includes('<w:pPr>')) {
    updatedParagraph = paragraph.replace(
      /<w:pPr>/,
      '<w:pPr><w:pageBreakBefore/>'
    );
  } else {
    updatedParagraph = paragraph.replace(
      /(<w:p[^>]*>)/,
      '$1<w:pPr><w:pageBreakBefore/></w:pPr>'
    );
  }

  console.log('\nAdding page break...');

  // Replace in XML
  xml = xml.substring(0, pStart) + updatedParagraph + xml.substring(pEnd);

  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Page break added before "Samenvatting"');
  found = true;
  break;
}

if (!found) {
  console.log('\nERROR: "Samenvatting" body heading not found');
  process.exit(1);
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');