import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTemplateUrl() {
  console.log('Fixing template URL...');

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
  console.log('Template loaded, searching for hardcoded URLs...');

  // Search for the hardcoded URL
  const urlPatterns = [
    'https://www.valkenswaard.nl/',
    'https://www.valkenswaard.nl',
    'www.valkenswaard.nl',
    'valkenswaard.nl'
  ];

  let foundAny = false;
  for (const pattern of urlPatterns) {
    const regex = new RegExp(pattern, 'gi');
    const matches = xmlContent.match(regex);
    if (matches) {
      console.log(`Found "${pattern}" - ${matches.length} occurrence(s)`);
      foundAny = true;
    }
  }

  if (!foundAny) {
    console.log('No hardcoded URLs found');
    return;
  }

  // Replace the URLs with placeholder
  console.log('\nReplacing URLs with {websiteUrl} placeholder...');

  // Replace all variations
  xmlContent = xmlContent.replace(/https:\/\/www\.valkenswaard\.nl\/?/gi, '{websiteUrl}');
  xmlContent = xmlContent.replace(/www\.valkenswaard\.nl/gi, '{websiteUrl}');

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
  console.log('\nReplaced hardcoded URLs with placeholder "{websiteUrl}"');
  console.log('The DOCX export will now use the actual website URL from the project.');
}

// Run the script
fixTemplateUrl().catch((error) => {
  console.error('Error fixing template:', error);
  process.exit(1);
});