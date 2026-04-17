import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTemplateWebsiteToFormulieren() {
  console.log('Fixing "website" to "formulieren" in template...');

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
  console.log('Template loaded, searching for "website" references...');

  // Search for patterns like "Toegankelijkheidsonderzoek website"
  const websitePattern = /Toegankelijkheidsonderzoek\s+website/gi;
  const matches = xmlContent.match(websitePattern);

  if (matches && matches.length > 0) {
    console.log(`\nFound ${matches.length} occurrence(s) of "Toegankelijkheidsonderzoek website"`);
    console.log('Matches:', matches);

    console.log('\nReplacing with "Toegankelijkheidsonderzoek formulieren"...');
    xmlContent = xmlContent.replace(websitePattern, 'Toegankelijkheidsonderzoek formulieren');
  } else {
    console.log('\nNo occurrences of "Toegankelijkheidsonderzoek website" found');
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
  console.log('\nReplaced "website" with "formulieren" in title references');
}

// Run the script
fixTemplateWebsiteToFormulieren().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});