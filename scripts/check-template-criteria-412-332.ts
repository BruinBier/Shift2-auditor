import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function checkTemplateCriteria() {
  console.log('Checking criteria 4.1.2 and 3.3.2 in template...\n');

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

  const xmlContent = doc.asText();

  // Check criteria
  const criteriaCodes = ['4.1.2', '3.3.2'];

  for (const code of criteriaCodes) {
    console.log(`\n=== Checking ${code} ===`);

    // Find the criterion in the table
    let index = xmlContent.indexOf(code);

    // Skip table of contents if needed
    if (index < 50000 && xmlContent.indexOf(code, index + 1) > 0) {
      index = xmlContent.indexOf(code, index + 1);
    }

    if (index === -1) {
      console.log(`❌ Criterion ${code} not found`);
      continue;
    }

    console.log(`Found at position: ${index}`);

    // Get context (2000 chars after the criterion)
    const context = xmlContent.substring(index, index + 2000);

    // Look for status indicators
    const voldoetNiet = context.indexOf('Voldoet niet');
    const voldoet = context.indexOf('>Voldoet<');

    console.log(`Status indicators:`);
    console.log(`  "Voldoet niet" at: ${voldoetNiet !== -1 ? voldoetNiet : 'NOT FOUND'}`);
    console.log(`  "Voldoet" at: ${voldoet !== -1 ? voldoet : 'NOT FOUND'}`);

    // Check which one comes first
    if (voldoetNiet !== -1 && (voldoet === -1 || voldoetNiet < voldoet)) {
      console.log(`✓ Status: Voldoet niet (correct for failed criterion)`);
    } else if (voldoet !== -1) {
      console.log(`❌ Status: Voldoet (should be "Voldoet niet" for failed criterion!)`);
    } else {
      console.log(`❓ Status unclear`);
    }

    // Check for bold formatting
    const hasBold = context.substring(0, 1500).includes('<w:b/>');
    console.log(`Bold formatting: ${hasBold ? '✓ Yes (correct for failed)' : '❌ No (should be bold)'}`);
  }

  console.log('\n');
}

checkTemplateCriteria().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});