import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

// Create backup first
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`Created backup: ${path.basename(backupPath)}`);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const documentXml = zip.file('word/document.xml');
if (documentXml) {
  let xmlContent = documentXml.asText();

  // Find "Bevindingen" heading (Heading2 or Kop2)
  let searchPos = 0;
  while ((searchPos = xmlContent.indexOf('Bevindingen', searchPos)) !== -1) {
    const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);

    if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
      console.log('Found Bevindingen Heading2');

      // Find the end of the heading paragraph
      const headingStart = xmlContent.lastIndexOf('<w:p', searchPos);
      const headingEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;

      console.log('Heading ends at position:', headingEnd);

      // Now find the next paragraph (the intro text paragraph)
      const nextPStart = xmlContent.indexOf('<w:p', headingEnd);

      if (nextPStart !== -1) {
        // Find the end of this paragraph
        const nextPEnd = xmlContent.indexOf('</w:p>', nextPStart) + '</w:p>'.length;

        // Extract the text to verify it's the intro text
        const paragraphContent = xmlContent.substring(nextPStart, nextPEnd);
        const textMatch = paragraphContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/);

        if (textMatch && textMatch[1].includes('Hieronder worden de vastgestelde afwijkingen')) {
          console.log('\nFound intro paragraph to remove:');
          console.log(textMatch[1].substring(0, 100) + '...');

          // Remove this entire paragraph
          xmlContent = xmlContent.substring(0, nextPStart) + xmlContent.substring(nextPEnd);

          console.log('\n✓ Removed intro paragraph');

          // Update the ZIP
          zip.file('word/document.xml', xmlContent);

          // Write the updated template
          const updatedBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
          fs.writeFileSync(templatePath, updatedBuffer);

          console.log(`✓ Updated template saved to: ${path.basename(templatePath)}`);
          console.log(`✓ Backup saved at: ${path.basename(backupPath)}`);
        } else {
          console.log('\nNext paragraph is not the intro text:');
          console.log(textMatch ? textMatch[1].substring(0, 100) : 'No text found');
        }
      } else {
        console.log('Could not find next paragraph after heading');
      }

      break;
    }
    searchPos++;
  }
} else {
  console.log('Could not find document.xml in template');
}