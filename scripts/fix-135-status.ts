import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fix135Status() {
  console.log('Fixing 1.3.5 status...\n');

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
  console.log('Looking for 1.3.5...');

  // Find 1.3.5
  let index = xmlContent.indexOf('1.3.5');

  // Skip TOC if needed
  if (index < 50000 && xmlContent.indexOf('1.3.5', index + 1) > 0) {
    index = xmlContent.indexOf('1.3.5', index + 1);
  }

  if (index === -1) {
    console.log('  ❌ Not found\n');
    process.exit(1);
  }

  console.log(`  Found at position ${index}`);

  // Find the table row
  const trStart = xmlContent.lastIndexOf('<w:tr ', index);
  const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;

  console.log(`  Table row from ${trStart} to ${trEnd}`);

  let tableRow = xmlContent.substring(trStart, trEnd);

  // Debug: look for all "Voldoet" occurrences in the row
  console.log('\nSearching for "Voldoet" patterns in row...');

  let searchIndex = 0;
  const voldoetOccurrences: Array<{ index: number; text: string }> = [];

  while ((searchIndex = tableRow.indexOf('Voldoet', searchIndex)) !== -1) {
    const contextStart = Math.max(0, searchIndex - 10);
    const contextEnd = Math.min(tableRow.length, searchIndex + 20);
    const context = tableRow.substring(contextStart, contextEnd);

    voldoetOccurrences.push({
      index: searchIndex,
      text: context,
    });

    searchIndex++;
  }

  console.log(`Found ${voldoetOccurrences.length} occurrences of "Voldoet":`);
  voldoetOccurrences.forEach((occ, i) => {
    console.log(`  ${i + 1}. At ${occ.index}: "${occ.text}"`);
  });

  // Find all patterns like ">Voldoet<" (status cell)
  const statusPattern = />Voldoet</g;
  let match;
  const statusMatches: number[] = [];

  while ((match = statusPattern.exec(tableRow)) !== null) {
    statusMatches.push(match.index);
  }

  console.log(`\nFound ${statusMatches.length} status cell patterns (">Voldoet<"):`);
  statusMatches.forEach((idx, i) => {
    const contextStart = Math.max(0, idx - 20);
    const contextEnd = Math.min(tableRow.length, idx + 30);
    console.log(`  ${i + 1}. At ${idx}: "${tableRow.substring(contextStart, contextEnd)}"`);
  });

  // The status cell should be the LAST occurrence
  if (statusMatches.length > 0) {
    const lastStatusIndex = statusMatches[statusMatches.length - 1];
    console.log(`\nChanging status at position ${lastStatusIndex}...`);

    // Replace ">Voldoet<" with ">Voldoet niet<"
    const before = tableRow.substring(0, lastStatusIndex + 1);
    const after = tableRow.substring(lastStatusIndex + 8); // +8 for "Voldoet<"
    tableRow = before + 'Voldoet niet<' + after;

    console.log('  ✓ Changed to "Voldoet niet"');
  } else {
    console.log('  ❌ No status pattern found');
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

fix135Status().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});