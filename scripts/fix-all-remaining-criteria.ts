import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixAllRemainingCriteria() {
  console.log('Fixing all remaining criteria issues...\n');

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

  // Criteria to fix: [code, needsStatusChange, needsBold]
  const criteriaToFix = [
    { code: '1.3.3', needsStatusChange: true, needsBold: true, title: 'Zintuiglijke eigenschappen' },
    { code: '1.3.5', needsStatusChange: true, needsBold: true, title: 'Identificeer het doel van de input' },
    { code: '2.4.6', needsStatusChange: false, needsBold: true, title: 'Koppen en labels' },
  ];

  for (const criterion of criteriaToFix) {
    console.log(`Processing ${criterion.code} - ${criterion.title}...`);

    // Find the criterion in the table
    let index = xmlContent.indexOf(criterion.code);

    // Skip TOC if needed
    if (index < 50000 && xmlContent.indexOf(criterion.code, index + 1) > 0) {
      index = xmlContent.indexOf(criterion.code, index + 1);
    }

    if (index === -1) {
      console.log(`  ❌ Not found\n`);
      continue;
    }

    console.log(`  Found at position ${index}`);

    // Find the table row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index);
    const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;

    console.log(`  Table row from ${trStart} to ${trEnd}`);

    let tableRow = xmlContent.substring(trStart, trEnd);

    // Change status if needed
    if (criterion.needsStatusChange) {
      const lastVoldoetIndex = tableRow.lastIndexOf('>Voldoet<');
      if (lastVoldoetIndex !== -1) {
        const before = tableRow.substring(0, lastVoldoetIndex + 1);
        const after = tableRow.substring(lastVoldoetIndex + 8);
        tableRow = before + 'Voldoet niet<' + after;
        console.log(`  ✓ Changed status to "Voldoet niet"`);
      }
    }

    // Add bold formatting if needed
    if (criterion.needsBold) {
      tableRow = tableRow.replace(/<w:rPr>/g, '<w:rPr><w:b/><w:bCs/>');
      const boldCountAfter = (tableRow.match(/<w:b\/>/g) || []).length;
      console.log(`  ✓ Added bold formatting (${boldCountAfter} bold tags)`);
    }

    // Replace in the document
    xmlContent = xmlContent.substring(0, trStart) + tableRow + xmlContent.substring(trEnd);

    console.log(`  ✓ Fixed ${criterion.code}\n`);
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
  console.log('  - 1.3.3: Fixed status and bold');
  console.log('  - 1.3.5: Fixed status and bold');
  console.log('  - 2.4.6: Added bold formatting');
}

fixAllRemainingCriteria().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});