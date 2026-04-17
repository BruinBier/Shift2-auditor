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

  // Find the "Bevindingen" section (the real one, not the TOC entry)
  const searchText = 'Hieronder worden de vastgestelde afwijkingen beschreven';
  const index = xmlContent.indexOf(searchText);

  if (index !== -1) {
    console.log('Found Bevindingen section at position:', index);

    // Extract a large section to see the full structure
    const chunk = xmlContent.substring(index - 1000, index + 15000);

    // Save to file for inspection
    fs.writeFileSync(
      path.join(process.cwd(), 'bevindingen-section.xml'),
      chunk
    );
    console.log('Saved bevindingen section to bevindingen-section.xml');

    // Extract text to understand structure
    const textMatches = chunk.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches) {
      console.log('\n=== Text content in Bevindingen section ===\n');
      const texts = textMatches.map(t => t.replace(/<[^>]+>/g, ''));
      texts.forEach((text, i) => {
        // Only show non-empty text
        if (text.trim()) {
          console.log(`${i + 1}. "${text}"`);
        }
      });
    }

    // Look for markers/placeholders
    const placeholders = chunk.match(/\{[^}]+\}/g);
    if (placeholders) {
      console.log('\n\n=== Placeholders found ===');
      const uniquePlaceholders = [...new Set(placeholders)];
      uniquePlaceholders.forEach(p => console.log(p));
    }
  } else {
    console.log('Bevindingen section not found');
  }
}