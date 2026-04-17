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

  const index = xmlContent.indexOf('Bevindingen');
  if (index !== -1) {
    // Get a large chunk to see the structure
    const chunk = xmlContent.substring(index, index + 10000);

    // Extract all text
    const textMatches = chunk.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches) {
      console.log('=== Text after "Bevindingen" heading ===\n');
      const texts = textMatches.slice(0, 50).map(t => t.replace(/<[^>]+>/g, ''));
      texts.forEach((text, i) => {
        console.log(`${i + 1}. "${text}"`);
      });
    }
  }
}