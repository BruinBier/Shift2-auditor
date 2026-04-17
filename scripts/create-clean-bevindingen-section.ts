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

console.log('=== Recreating Bevindingen Section ===\n');

// Find and delete entire current Bevindingen section
let bevPos = xml.indexOf('Bevindingen');
while (bevPos !== -1) {
  const before = xml.substring(Math.max(0, bevPos - 200), bevPos);
  if (before.includes('pStyle w:val="Kop2"')) {
    console.log('Found Bevindingen section to replace');

    // Find start and end of this paragraph
    const pStart = Math.max(
      xml.lastIndexOf('<w:p ', bevPos),
      xml.lastIndexOf('<w:p>', bevPos)
    );
    const pEnd = xml.indexOf('</w:p>', bevPos) + '</w:p>'.length;

    // Find next section (Opmerkingen)
    const nextSection = xml.indexOf('Opmerkingen', bevPos);
    if (nextSection === -1) {
      console.error('Could not find Opmerkingen section');
      process.exit(1);
    }

    const nextSectionStart = Math.max(
      xml.lastIndexOf('<w:p ', nextSection),
      xml.lastIndexOf('<w:p>', nextSection)
    );

    // Create new clean Bevindingen section with proper structure
    const newBevindingen = `<w:p w14:paraId="5D94C169" w14:textId="77777777" w:rsidR="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop2"/></w:pPr><w:bookmarkStart w:id="8" w:name="_Toc223874297"/><w:r w:rsidRPr="00280895"><w:t>Bevindingen</w:t></w:r><w:bookmarkEnd w:id="8"/></w:p><w:p w14:paraId="0C497706" w14:textId="77777777" w:rsidR="00280895" w:rsidRPr="00280895" w:rsidRDefault="00280895" w:rsidP="00280895"><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r w:rsidRPr="00280895"><w:t>1.3.3 Zintuiglijke eigenschappen A</w:t></w:r></w:p>`;

    // Replace everything from Bevindingen heading to Opmerkingen
    xml = xml.substring(0, pStart) + newBevindingen + xml.substring(nextSectionStart);

    console.log('✓ Replaced Bevindingen section with clean version');

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
console.log('✓ Bevindingen section now has:');
console.log('  - "Bevindingen" with Kop2 style');
console.log('  - "1.3.3 Zintuiglijke eigenschappen A" with Kop3 style');