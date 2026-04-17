import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixFormulierenValidityText() {
  console.log('Fixing validity text in formulieren template...');

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
  console.log('Template loaded, searching for validity text...');

  // The old text pattern to find
  const oldPattern = /in de content of het publicatieproces/gi;

  // The new text to replace it with
  const newText = 'in de formulieren of in de wijze waarop deze worden beheerd en gepubliceerd';

  const matches = xmlContent.match(oldPattern);

  if (matches && matches.length > 0) {
    console.log(`\nFound ${matches.length} occurrence(s) of the old validity text`);
    console.log('Matches:', matches);

    console.log('\nReplacing with new formulieren-specific text...');
    xmlContent = xmlContent.replace(oldPattern, newText);
  } else {
    console.log('\nNo occurrences of old validity text found');
    console.log('Note: This might mean the text is already updated or split across XML tags');
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

  console.log('✓ Template updated successfully!');
  console.log('\nOld text: "in de content of het publicatieproces"');
  console.log('New text: "in de formulieren of in de wijze waarop deze worden beheerd en gepubliceerd"');
}

// Run the script
fixFormulierenValidityText().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});