import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const documentXml = zip.file('word/document.xml');
if (documentXml) {
  const xmlContent = documentXml.asText();

  // Search for "bevinding" or "finding" related text
  const searchTerms = [
    'Bevindingen',
    'bevinding',
    'Finding',
    'Voldoet niet',
  ];

  searchTerms.forEach(term => {
    const index = xmlContent.indexOf(term);
    if (index !== -1) {
      console.log(`Found "${term}" at position ${index}`);
      
      // Get some context
      const context = xmlContent.substring(index - 100, index + 200);
      const textMatches = context.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches) {
        console.log('Context:', textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' '));
      }
      console.log('');
    }
  });
}
