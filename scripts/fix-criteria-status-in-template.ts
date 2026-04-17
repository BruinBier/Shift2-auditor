import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixCriteriaStatusInTemplate() {
  console.log('Fixing criteria status in formulieren template...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template from:', templatePath);

  // Read the template file
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  // Get the main document XML
  const doc = zip.file('word/document.xml');
  if (!doc) {
    throw new Error('Could not find word/document.xml in template');
  }

  let xmlContent = doc.asText();

  console.log('Template loaded, analyzing criteria table...\n');

  // The problem: 1.1.1 and 1.3.1 have "Voldoet niet" but should have "Voldoet"
  // We need to find the table rows for these criteria and change their status

  // Strategy: Find "1.1.1" and look for "Voldoet niet" within the next 500 characters
  let index_111 = 0;
  let replaced_111 = 0;

  console.log('Searching for 1.1.1 with "Voldoet niet"...');

  while ((index_111 = xmlContent.indexOf('1.1.1', index_111)) !== -1) {
    // Look for "Voldoet niet" in the next 1000 characters
    const searchEnd = Math.min(index_111 + 1000, xmlContent.length);
    const segment = xmlContent.substring(index_111, searchEnd);

    const voldoetNietIndex = segment.indexOf('Voldoet niet');

    if (voldoetNietIndex !== -1 && voldoetNietIndex < 800) {
      // Found it! Replace this occurrence
      const absoluteIndex = index_111 + voldoetNietIndex;

      console.log(`\nFound "Voldoet niet" at position ${absoluteIndex} (${voldoetNietIndex} chars after 1.1.1)`);
      console.log('Context before:', xmlContent.substring(absoluteIndex - 50, absoluteIndex + 50));

      // Replace only this specific occurrence
      const before = xmlContent.substring(0, absoluteIndex);
      const after = xmlContent.substring(absoluteIndex + 'Voldoet niet'.length);
      xmlContent = before + 'Voldoet' + after;

      replaced_111++;
      console.log('Replaced with "Voldoet"');

      // Move past this occurrence
      index_111 = absoluteIndex + 10;
    } else {
      // Move to next occurrence of 1.1.1
      index_111++;
    }
  }

  console.log(`\nTotal replacements for 1.1.1: ${replaced_111}`);

  // For 1.3.1 Info en relaties
  let index_131 = 0;
  let replaced_131 = 0;

  console.log('\nSearching for 1.3.1 with "Voldoet niet"...');

  while ((index_131 = xmlContent.indexOf('1.3.1', index_131)) !== -1) {
    // Look for "Voldoet niet" in the next 1000 characters
    const searchEnd = Math.min(index_131 + 1000, xmlContent.length);
    const segment = xmlContent.substring(index_131, searchEnd);

    const voldoetNietIndex = segment.indexOf('Voldoet niet');

    if (voldoetNietIndex !== -1 && voldoetNietIndex < 800) {
      // Found it! Replace this occurrence
      const absoluteIndex = index_131 + voldoetNietIndex;

      console.log(`\nFound "Voldoet niet" at position ${absoluteIndex} (${voldoetNietIndex} chars after 1.3.1)`);
      console.log('Context before:', xmlContent.substring(absoluteIndex - 50, absoluteIndex + 50));

      // Replace only this specific occurrence
      const before = xmlContent.substring(0, absoluteIndex);
      const after = xmlContent.substring(absoluteIndex + 'Voldoet niet'.length);
      xmlContent = before + 'Voldoet' + after;

      replaced_131++;
      console.log('Replaced with "Voldoet"');

      // Move past this occurrence
      index_131 = absoluteIndex + 10;
    } else {
      // Move to next occurrence of 1.3.1
      index_131++;
    }
  }

  console.log(`\nTotal replacements for 1.3.1: ${replaced_131}`);

  // Update the document XML
  zip.file('word/document.xml', xmlContent);

  console.log('\nWriting updated template...');

  // Generate the new Word document
  const newContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the new file
  fs.writeFileSync(templatePath, newContent);

  console.log('✓ Template updated successfully!');
  console.log(`\nSummary:`);
  console.log(`  - Changed 1.1.1 status: ${replaced_111 > 0 ? '✓' : '❌'}`);
  console.log(`  - Changed 1.3.1 status: ${replaced_131 > 0 ? '✓' : '❌'}`);
}

fixCriteriaStatusInTemplate().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});