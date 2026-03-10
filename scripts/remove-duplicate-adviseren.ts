import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function removeDuplicateAdviserenText() {
  console.log('Removing duplicate "Wij adviseren om" text from template...');

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

  // Find and remove the paragraph that contains "Wij adviseren om formuliercontent"
  // This paragraph comes AFTER {managementSummary}, so we need to be careful

  // Pattern: find the paragraph with the hardcoded advice text
  // The paragraph looks like: <w:p ...><w:r><w:t>Wij adviseren om formuliercontent...</w:t></w:r></w:p>

  const advicePattern = /<w:p[^>]*>.*?<w:t>Wij adviseren om formuliercontent periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces van formulieren\.<\/w:t>.*?<\/w:p>/gs;

  const matches = xmlContent.match(advicePattern);

  if (matches && matches.length > 0) {
    console.log(`Found ${matches.length} paragraph(s) with hardcoded advice text`);
    console.log('Removing...');

    xmlContent = xmlContent.replace(advicePattern, '');

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
    console.log('\nRemoved hardcoded "Wij adviseren om..." paragraph from template');
  } else {
    console.log('No hardcoded advice text found (maybe already removed?)');
  }
}

// Run the script
removeDuplicateAdviserenText().catch((error) => {
  console.error('Error removing text:', error);
  process.exit(1);
});