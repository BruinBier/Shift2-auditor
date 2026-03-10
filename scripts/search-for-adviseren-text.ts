import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function searchForAdviserenText() {
  console.log('Searching for "Wij adviseren om" text in template...');

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

  const xmlContent = doc.asText();

  // Search for "Wij adviseren" text
  const searchPattern = /Wij adviseren om/gi;
  const matches = xmlContent.match(searchPattern);

  if (matches && matches.length > 0) {
    console.log(`\nFound "${matches.length}" occurrence(s) of "Wij adviseren om"`);

    // Find context around each match
    let lastIndex = 0;
    let occurrence = 0;
    while ((lastIndex = xmlContent.indexOf('Wij adviseren om', lastIndex)) !== -1) {
      occurrence++;
      const start = Math.max(0, lastIndex - 200);
      const end = Math.min(xmlContent.length, lastIndex + 300);
      const context = xmlContent.substring(start, end);

      console.log(`\n--- Occurrence ${occurrence} ---`);
      console.log('Context:', context);
      console.log('Position:', lastIndex);

      lastIndex += 'Wij adviseren om'.length;
    }
  } else {
    console.log('\nNo occurrences of "Wij adviseren om" found in template');
  }
}

// Run the script
searchForAdviserenText().catch((error) => {
  console.error('Error searching template:', error);
  process.exit(1);
});