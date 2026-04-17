import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTableCriteriaStatus() {
  console.log('Fixing criteria status in table...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template from:', templatePath);

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();

  console.log('Template loaded\n');

  // Fix 1.1.1 - position 54166, "Voldoet niet" is at offset ~1773
  const index_111_table = 54166;
  const voldoetNiet_111_offset = 1773;
  const voldoetNiet_111_absoluteIndex = index_111_table + voldoetNiet_111_offset;

  console.log(`Fixing 1.1.1 at absolute position ${voldoetNiet_111_absoluteIndex}...`);

  // Verify it's the right location
  const check_111 = xmlContent.substring(voldoetNiet_111_absoluteIndex, voldoetNiet_111_absoluteIndex + 12);
  console.log(`  Checking: "${check_111}"`);

  if (check_111 === 'Voldoet niet') {
    const before = xmlContent.substring(0, voldoetNiet_111_absoluteIndex);
    const after = xmlContent.substring(voldoetNiet_111_absoluteIndex + 12);
    xmlContent = before + 'Voldoet' + after;
    console.log('  ✓ Changed to "Voldoet"\n');
  } else {
    console.log('  ❌ Text does not match expected "Voldoet niet"\n');
  }

  // Fix 1.3.1 - position 71640, "Voldoet niet" is at offset ~1767
  const index_131_table = 71640;
  const voldoetNiet_131_offset = 1767;
  let voldoetNiet_131_absoluteIndex = index_131_table + voldoetNiet_131_offset;

  // Adjust for the previous replacement (we removed 5 characters: "Voldoet niet" -> "Voldoet")
  voldoetNiet_131_absoluteIndex -= 5;

  console.log(`Fixing 1.3.1 at adjusted absolute position ${voldoetNiet_131_absoluteIndex}...`);

  // Verify it's the right location
  const check_131 = xmlContent.substring(voldoetNiet_131_absoluteIndex, voldoetNiet_131_absoluteIndex + 12);
  console.log(`  Checking: "${check_131}"`);

  if (check_131 === 'Voldoet niet') {
    const before = xmlContent.substring(0, voldoetNiet_131_absoluteIndex);
    const after = xmlContent.substring(voldoetNiet_131_absoluteIndex + 12);
    xmlContent = before + 'Voldoet' + after;
    console.log('  ✓ Changed to "Voldoet"\n');
  } else {
    console.log('  ❌ Text does not match expected "Voldoet niet"\n');
  }

  // Update the document XML
  zip.file('word/document.xml', xmlContent);

  console.log('Writing updated template...');

  // Generate the new Word document
  const newContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the new file
  fs.writeFileSync(templatePath, newContent);

  console.log('✓ Template updated successfully!\n');
  console.log('Summary:');
  console.log('  - 1.1.1 Niet-tekstuele content: changed to "Voldoet"');
  console.log('  - 1.3.1 Info en relaties: changed to "Voldoet"');
}

fixTableCriteriaStatus().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});