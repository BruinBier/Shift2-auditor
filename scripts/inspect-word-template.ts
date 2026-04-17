import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function inspectWordTemplate() {
  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template:', templatePath);

  // Read the template
  const templateContent = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(templateContent);

  // Get document.xml
  const documentXml = zip.file('word/document.xml');
  if (!documentXml) {
    console.error('document.xml not found in template');
    return;
  }

  let xmlContent = documentXml.asText();

  // Search for specific patterns
  const patterns = [
    'formuliercontent',
    'substantiële wijzigingen',
    'formulieren of in de wijze',
    'content voldoet',
    'Wij adviseren om'
  ];

  patterns.forEach(pattern => {
    const matches = xmlContent.match(new RegExp(pattern, 'gi'));
    if (matches) {
      console.log(`\nFound "${pattern}": ${matches.length} occurrence(s)`);

      // Get context around first match
      const index = xmlContent.toLowerCase().indexOf(pattern.toLowerCase());
      if (index >= 0) {
        const start = Math.max(0, index - 100);
        const end = Math.min(xmlContent.length, index + pattern.length + 100);
        const context = xmlContent.substring(start, end);
        console.log('Context:', context.replace(/</g, '\n<').substring(0, 300));
      }
    } else {
      console.log(`\n"${pattern}": NOT FOUND`);
    }
  });
}

inspectWordTemplate().catch(console.error);