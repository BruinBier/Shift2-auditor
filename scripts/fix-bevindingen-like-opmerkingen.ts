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

// Find the Bevindingen paragraph that has Kop2
let bevPos = xml.indexOf('Bevindingen');
while (bevPos !== -1) {
  const before = xml.substring(Math.max(0, bevPos - 200), bevPos);
  if (before.includes('pStyle w:val="Kop2"')) {
    console.log('Found Bevindingen with Kop2 at position:', bevPos);

    // Get the full paragraph
    const pStart = Math.max(
      xml.lastIndexOf('<w:p ', bevPos),
      xml.lastIndexOf('<w:p>', bevPos)
    );
    const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;

    const oldParagraph = xml.substring(pStart, pEnd);

    console.log('\nOld paragraph:');
    console.log(oldParagraph);

    // Create new paragraph based on "Opmerkingen" structure
    // Use bookmark ID 8 (which is already in the XML for Bevindingen)
    const newParagraph = `<w:p w14:paraId="5D94C169" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:bookmarkStart w:id="8" w:name="_Toc223874297"/><w:r w:rsidRPr="00280895"><w:t>Bevindingen</w:t></w:r><w:bookmarkEnd w:id="8"/></w:p>`;

    console.log('\nNew paragraph:');
    console.log(newParagraph);

    // Replace
    xml = xml.substring(0, pStart) + newParagraph + xml.substring(pEnd);

    console.log('\n✓ Replaced Bevindingen paragraph');

    break;
  }
  bevPos = xml.indexOf('Bevindingen', bevPos + 1);
}

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template updated successfully');
console.log('✓ Bevindingen now uses same structure as other Kop2 headings');