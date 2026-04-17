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

  // Find second occurrence
  const firstIndex = xmlContent.indexOf('bevinding');
  const secondIndex = xmlContent.indexOf('bevinding', firstIndex + 1);

  console.log(`Second occurrence at position: ${secondIndex}\n`);

  if (secondIndex !== -1) {
    // Get context before and after
    const chunk = xmlContent.substring(secondIndex - 500, secondIndex + 3000);

    // Extract all text
    const textMatches = chunk.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches) {
      console.log('=== Context around second "bevinding" ===\n');
      const texts = textMatches.map(t => t.replace(/<[^>]+>/g, ''));
      texts.forEach((text, i) => {
        console.log(`${i + 1}. "${text}"`);
      });
    }
  }
}