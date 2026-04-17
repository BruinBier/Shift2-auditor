import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fix135NietAanwezig() {
  console.log('Fixing 1.3.5 "niet aanwezig" to "Voldoet niet"...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();

  console.log('Template loaded\n');

  // Find the specific pattern for 1.3.5 with "niet aanwezig"
  // We're looking for: 1.3.5 ... AA ... niet aanwezig

  let index = xmlContent.indexOf('1.3.5 Identificeer het doel van de invoer');

  if (index === -1) {
    console.log('❌ 1.3.5 not found');
    process.exit(1);
  }

  console.log(`Found 1.3.5 at position ${index}`);

  // Find the table row
  const trStart = xmlContent.lastIndexOf('<w:tr ', index);
  const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;

  console.log(`Table row from ${trStart} to ${trEnd}`);

  let tableRow = xmlContent.substring(trStart, trEnd);

  // Replace "niet aanwezig" pattern with "Voldoet niet"
  // The pattern is: <w:t>niet</w:t>...<w:t xml:space="preserve"> aanwezig</w:t>
  // We need to replace this with just: <w:t>Voldoet niet</w:t>

  const pattern = /<w:t>niet<\/w:t><w:proofErr w:type="gramEnd"\/><w:r[^>]*><w:rPr>[^<]*<w:b\/><w:bCs\/>[^<]*<\/w:rPr><w:t xml:space="preserve"> aanwezig<\/w:t>/;

  if (pattern.test(tableRow)) {
    console.log('Found pattern with gramEnd');
    tableRow = tableRow.replace(pattern, '<w:t>Voldoet niet</w:t>');
    console.log('✓ Replaced with "Voldoet niet"');
  } else {
    // Try simpler pattern
    const simplePattern = /<w:t>niet<\/w:t>[^<]*<w:proofErr[^>]*\/>[^<]*<w:r[^>]*>[^<]*<w:rPr>[^<]*<\/w:rPr>[^<]*<w:t[^>]*> aanwezig<\/w:t>/;

    if (simplePattern.test(tableRow)) {
      console.log('Found pattern (simple)');
      tableRow = tableRow.replace(simplePattern, '<w:t>Voldoet niet</w:t>');
      console.log('✓ Replaced with "Voldoet niet"');
    } else {
      // Manual replacement - find "niet" followed by " aanwezig" and replace both
      const nietIndex = tableRow.indexOf('<w:t>niet</w:t>');
      const aanwezigIndex = tableRow.indexOf('aanwezig</w:t>', nietIndex);

      if (nietIndex !== -1 && aanwezigIndex !== -1) {
        console.log(`Found "niet" at ${nietIndex} and "aanwezig" at ${aanwezigIndex}`);

        // Extract everything between and including these tags
        const beforeNiet = tableRow.substring(0, nietIndex);
        const afterAanwezig = tableRow.substring(aanwezigIndex + 'aanwezig</w:t>'.length);

        // Replace with just "Voldoet niet" in one tag
        tableRow = beforeNiet + '<w:t>Voldoet niet</w:t>' + afterAanwezig;

        console.log('✓ Replaced with "Voldoet niet" (manual)');
      } else {
        console.log('❌ Could not find pattern to replace');
      }
    }
  }

  // Replace in the document
  xmlContent = xmlContent.substring(0, trStart) + tableRow + xmlContent.substring(trEnd);

  // Update the document XML
  zip.file('word/document.xml', xmlContent);

  console.log('\nWriting updated template...');

  const newContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  fs.writeFileSync(templatePath, newContent);

  console.log('✓ Template updated successfully!');
}

fix135NietAanwezig().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});