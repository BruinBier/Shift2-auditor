import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function findCriteriaTableStatus() {
  console.log('Finding criteria table status...\n');

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

  // Find 1.1.1 at position 54166 (table occurrence)
  const index_111_table = 54166;
  const context_111 = xmlContent.substring(index_111_table, index_111_table + 3000);

  console.log('=== 1.1.1 Table Context (3000 chars) ===\n');
  console.log(context_111);
  console.log('\n');

  // Find 1.3.1 at position 71640 (table occurrence)
  const index_131_table = 71640;
  const context_131 = xmlContent.substring(index_131_table, index_131_table + 3000);

  console.log('\n=== 1.3.1 Table Context (3000 chars) ===\n');
  console.log(context_131);
  console.log('\n');

  // Look for "Voldoet" or "Voldoet niet" patterns in both
  console.log('\n=== Status Analysis ===\n');

  const voldoetNiet_111 = context_111.indexOf('Voldoet niet');
  const voldoet_111 = context_111.indexOf('>Voldoet<');

  console.log(`1.1.1 table row:`);
  console.log(`  "Voldoet niet" found at: ${voldoetNiet_111 !== -1 ? voldoetNiet_111 : 'NOT FOUND'}`);
  console.log(`  "Voldoet" found at: ${voldoet_111 !== -1 ? voldoet_111 : 'NOT FOUND'}`);

  const voldoetNiet_131 = context_131.indexOf('Voldoet niet');
  const voldoet_131 = context_131.indexOf('>Voldoet<');

  console.log(`\n1.3.1 table row:`);
  console.log(`  "Voldoet niet" found at: ${voldoetNiet_131 !== -1 ? voldoetNiet_131 : 'NOT FOUND'}`);
  console.log(`  "Voldoet" found at: ${voldoet_131 !== -1 ? voldoet_131 : 'NOT FOUND'}`);
}

findCriteriaTableStatus().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});