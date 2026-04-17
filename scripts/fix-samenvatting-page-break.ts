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

console.log('=== Fixing page breaks for "Samenvatting" ===\n');

// Find all occurrences of "Samenvatting"
let pos = 0;
let tocFixed = false;
let bodyFixed = false;

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

  if (style.includes('Inhopg')) {
    // TOC entry - remove page break if present
    console.log('→ This is in TOC');

    if (paragraph.includes('<w:pageBreakBefore/>')) {
      console.log('  Removing page break from TOC entry...');

      const updatedParagraph = paragraph.replace(/<w:pageBreakBefore\/>/g, '');
      xml = xml.substring(0, pStart) + updatedParagraph + xml.substring(pEnd);

      tocFixed = true;
      console.log('  ✓ Page break removed from TOC');
    } else {
      console.log('  ✓ No page break in TOC (good)');
    }
  } else {
    // Body heading - ensure page break is present
    console.log('→ This is the body heading');

    if (paragraph.includes('<w:pageBreakBefore/>')) {
      console.log('  ✓ Page break already present in body');
      bodyFixed = true;
    } else {
      console.log('  Adding page break to body heading...');

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

      xml = xml.substring(0, pStart) + updatedParagraph + xml.substring(pEnd);
      bodyFixed = true;
      console.log('  ✓ Page break added to body');
    }
  }

  pos++;
}

// Save if changes were made
if (tocFixed || bodyFixed) {
  // Update ZIP
  zip.file('word/document.xml', xml);

  // Save
  const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, buf);

  console.log('\n✓ Changes saved');
  console.log(`  TOC fixed: ${tocFixed}`);
  console.log(`  Body has page break: ${bodyFixed}`);
} else {
  console.log('\n✓ Everything already correct');
}

console.log('\nPlease close Word completely and reopen the template to see the changes.');