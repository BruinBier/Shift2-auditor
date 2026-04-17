import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixFailedCriteria() {
  console.log('Fixing failed criteria 4.1.2 and 3.3.2 in template...\n');

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

  // Fix 3.3.2 first (comes earlier in document)
  console.log('Processing 3.3.2 table row...');

  let index_332 = xmlContent.indexOf('3.3.2');
  // Skip TOC if needed
  if (index_332 < 50000 && xmlContent.indexOf('3.3.2', index_332 + 1) > 0) {
    index_332 = xmlContent.indexOf('3.3.2', index_332 + 1);
  }

  if (index_332 !== -1) {
    console.log(`  Found 3.3.2 at position ${index_332}`);

    // Find the table row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index_332);
    const trEnd = xmlContent.indexOf('</w:tr>', index_332) + 7;

    console.log(`  Table row from ${trStart} to ${trEnd}`);

    let tableRow = xmlContent.substring(trStart, trEnd);

    // 1. Change "Voldoet" to "Voldoet niet"
    // Look for the status cell - it should have ">Voldoet<" pattern
    const voldoetPattern = />Voldoet</g;
    const voldoetMatches = tableRow.match(voldoetPattern);

    if (voldoetMatches && voldoetMatches.length > 0) {
      // Find the last occurrence (should be in the status column)
      const lastVoldoetIndex = tableRow.lastIndexOf('>Voldoet<');
      if (lastVoldoetIndex !== -1) {
        const before = tableRow.substring(0, lastVoldoetIndex + 1);
        const after = tableRow.substring(lastVoldoetIndex + 8); // +8 for "Voldoet<"
        tableRow = before + 'Voldoet niet<' + after;
        console.log(`  ✓ Changed status to "Voldoet niet"`);
      }
    }

    // 2. Add bold formatting
    // We need to add <w:b/> and <w:bCs/> tags to all <w:rPr> sections in the row
    // Replace <w:rPr> with <w:rPr><w:b/><w:bCs/>
    tableRow = tableRow.replace(/<w:rPr>/g, '<w:rPr><w:b/><w:bCs/>');

    // Also handle cases where there's already some formatting inside <w:rPr>
    // We need to add it right after <w:rPr> tag
    const boldCountAfter = (tableRow.match(/<w:b\/>/g) || []).length;
    console.log(`  ✓ Added bold formatting (${boldCountAfter} bold tags)`);

    // Replace in the document
    xmlContent = xmlContent.substring(0, trStart) + tableRow + xmlContent.substring(trEnd);

    console.log('  ✓ Fixed 3.3.2 row\n');
  } else {
    console.log('  ❌ Could not find 3.3.2\n');
  }

  // Fix 4.1.2
  console.log('Processing 4.1.2 table row...');

  let index_412 = xmlContent.indexOf('4.1.2');
  // Skip TOC if needed
  if (index_412 < 50000 && xmlContent.indexOf('4.1.2', index_412 + 1) > 0) {
    index_412 = xmlContent.indexOf('4.1.2', index_412 + 1);
  }

  if (index_412 !== -1) {
    console.log(`  Found 4.1.2 at position ${index_412}`);

    // Find the table row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index_412);
    const trEnd = xmlContent.indexOf('</w:tr>', index_412) + 7;

    console.log(`  Table row from ${trStart} to ${trEnd}`);

    let tableRow = xmlContent.substring(trStart, trEnd);

    // 1. Change "Voldoet" to "Voldoet niet"
    const lastVoldoetIndex = tableRow.lastIndexOf('>Voldoet<');
    if (lastVoldoetIndex !== -1) {
      const before = tableRow.substring(0, lastVoldoetIndex + 1);
      const after = tableRow.substring(lastVoldoetIndex + 8);
      tableRow = before + 'Voldoet niet<' + after;
      console.log(`  ✓ Changed status to "Voldoet niet"`);
    }

    // 2. Add bold formatting
    tableRow = tableRow.replace(/<w:rPr>/g, '<w:rPr><w:b/><w:bCs/>');

    const boldCountAfter = (tableRow.match(/<w:b\/>/g) || []).length;
    console.log(`  ✓ Added bold formatting (${boldCountAfter} bold tags)`);

    // Replace in the document
    xmlContent = xmlContent.substring(0, trStart) + tableRow + xmlContent.substring(trEnd);

    console.log('  ✓ Fixed 4.1.2 row\n');
  } else {
    console.log('  ❌ Could not find 4.1.2\n');
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
  console.log('  - 3.3.2: Changed to "Voldoet niet" with bold formatting');
  console.log('  - 4.1.2: Changed to "Voldoet niet" with bold formatting');
}

fixFailedCriteria().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});