import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTemplateOpdrachtgever() {
  console.log('Fixing template opdrachtgever name...');

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
  console.log('Template loaded, searching for hardcoded names...');

  // Search for common patterns where the client name might appear
  const clientNamePatterns = [
    'Valkenswaard',
    'valkenswaard',
    'Wierden',
    'wierden'
  ];

  let foundAny = false;
  for (const pattern of clientNamePatterns) {
    if (xmlContent.includes(pattern)) {
      console.log(`Found "${pattern}" in template`);
      foundAny = true;
    }
  }

  if (!foundAny) {
    console.log('No hardcoded client names found');
    return;
  }

  // Replace "Toegankelijkheidsonderzoek formulieren Valkenswaard" with placeholder
  // We need to be careful about the XML structure

  // First, let's count occurrences
  const valkenswaardCount = (xmlContent.match(/Valkenswaard/g) || []).length;
  console.log(`\nFound ${valkenswaardCount} occurrence(s) of "Valkenswaard"`);

  if (valkenswaardCount > 0) {
    console.log('Replacing "Valkenswaard" with "{opdrachtgeverNaam}"...');
    xmlContent = xmlContent.replace(/Valkenswaard/g, '{opdrachtgeverNaam}');
  }

  // Also check for patterns like "formulieren Valkenswaard" -> "formulieren {opdrachtgeverNaam}"
  // Or "Toegankelijkheidsonderzoek formulieren [ClientName]"

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
  console.log('\nReplaced "Valkenswaard" with placeholder "{opdrachtgeverNaam}"');
  console.log('The DOCX export will now use the actual client name from the database.');
}

// Run the script
fixTemplateOpdrachtgever().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});