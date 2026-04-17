import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function removeBoldFromPassingCriteria() {
  console.log('Removing bold formatting from passing criteria...\n');

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

  // Find the table rows for 1.1.1 and 1.3.1
  // We need to find the entire table row and remove <w:b/> and <w:bCs/> tags

  // Strategy: Find "1.1.1 Niet-tekstuele content" and then find the table row it's in
  // A table row starts with <w:tr and ends with </w:tr>

  console.log('Processing 1.1.1 table row...');

  // Find all occurrences of 1.1.1
  let index_111 = xmlContent.indexOf('1.1.1 Niet-tekstuele content');

  // We want the table occurrence, which should be around position 54166
  // Skip the first occurrence (table of contents)
  if (index_111 < 50000) {
    index_111 = xmlContent.indexOf('1.1.1 Niet-tekstuele content', index_111 + 1);
  }

  if (index_111 !== -1) {
    console.log(`  Found 1.1.1 at position ${index_111}`);

    // Find the start of the table row (search backwards for <w:tr)
    const trStart = xmlContent.lastIndexOf('<w:tr ', index_111);

    // Find the end of the table row (search forwards for </w:tr>)
    const trEnd = xmlContent.indexOf('</w:tr>', index_111) + 7;

    console.log(`  Table row from ${trStart} to ${trEnd}`);

    // Extract the table row
    let tableRow = xmlContent.substring(trStart, trEnd);

    // Count bold tags before
    const boldCountBefore = (tableRow.match(/<w:b\/>/g) || []).length;
    const boldCsCountBefore = (tableRow.match(/<w:bCs\/>/g) || []).length;
    console.log(`  Bold tags before: <w:b/>: ${boldCountBefore}, <w:bCs/>: ${boldCsCountBefore}`);

    // Remove all <w:b/> and <w:bCs/> tags from this row
    tableRow = tableRow.replace(/<w:b\/>/g, '');
    tableRow = tableRow.replace(/<w:bCs\/>/g, '');

    // Count bold tags after
    const boldCountAfter = (tableRow.match(/<w:b\/>/g) || []).length;
    const boldCsCountAfter = (tableRow.match(/<w:bCs\/>/g) || []).length;
    console.log(`  Bold tags after: <w:b/>: ${boldCountAfter}, <w:bCs/>: ${boldCsCountAfter}`);

    // Replace in the document
    xmlContent = xmlContent.substring(0, trStart) + tableRow + xmlContent.substring(trEnd);

    console.log('  ✓ Removed bold formatting from 1.1.1 row\n');
  } else {
    console.log('  ❌ Could not find 1.1.1 table row\n');
  }

  // Process 1.3.1
  console.log('Processing 1.3.1 table row...');

  let index_131 = xmlContent.indexOf('1.3.1 Info en relaties');

  if (index_131 !== -1) {
    console.log(`  Found 1.3.1 at position ${index_131}`);

    // Find the start of the table row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index_131);

    // Find the end of the table row
    const trEnd = xmlContent.indexOf('</w:tr>', index_131) + 7;

    console.log(`  Table row from ${trStart} to ${trEnd}`);

    // Extract the table row
    let tableRow = xmlContent.substring(trStart, trEnd);

    // Count bold tags before
    const boldCountBefore = (tableRow.match(/<w:b\/>/g) || []).length;
    const boldCsCountBefore = (tableRow.match(/<w:bCs\/>/g) || []).length;
    console.log(`  Bold tags before: <w:b/>: ${boldCountBefore}, <w:bCs/>: ${boldCsCountBefore}`);

    // Remove all <w:b/> and <w:bCs/> tags from this row
    tableRow = tableRow.replace(/<w:b\/>/g, '');
    tableRow = tableRow.replace(/<w:bCs\/>/g, '');

    // Count bold tags after
    const boldCountAfter = (tableRow.match(/<w:b\/>/g) || []).length;
    const boldCsCountAfter = (tableRow.match(/<w:bCs\/>/g) || []).length;
    console.log(`  Bold tags after: <w:b/>: ${boldCountAfter}, <w:bCs/>: ${boldCsCountAfter}`);

    // Replace in the document
    xmlContent = xmlContent.substring(0, trStart) + tableRow + xmlContent.substring(trEnd);

    console.log('  ✓ Removed bold formatting from 1.3.1 row\n');
  } else {
    console.log('  ❌ Could not find 1.3.1 table row\n');
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
  console.log('  - Removed bold formatting from 1.1.1 row');
  console.log('  - Removed bold formatting from 1.3.1 row');
}

removeBoldFromPassingCriteria().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});