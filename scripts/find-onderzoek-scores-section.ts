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

  // Find "Onderzoek scores"
  const searchText = 'Onderzoek scores';
  const index = xmlContent.indexOf(searchText);

  if (index !== -1) {
    console.log(`Found "${searchText}" at position:`, index);

    // Extract a larger section to see what's around it
    const sectionAfter = xmlContent.substring(index, index + 20000);

    // Find all text elements
    const textMatches = sectionAfter.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

    if (textMatches) {
      console.log('\nFirst 50 text elements after "Onderzoek scores":');
      const texts = textMatches.slice(0, 50).map(t => t.replace(/<[^>]+>/g, ''));
      texts.forEach((text, i) => {
        console.log(`${i + 1}. "${text}"`);
      });
    }

    // Look for ALL tables in this section
    const tables = sectionAfter.match(/<w:tbl[\s\S]*?<\/w:tbl>/g);
    console.log(`\n\nTables found in section: ${tables ? tables.length : 0}`);

    if (tables) {
      tables.forEach((table, idx) => {
        console.log(`\n=== Table ${idx + 1} ===`);
        const cellTexts = table.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (cellTexts) {
          console.log('Content:', cellTexts.slice(0, 20).map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
        }
      });
    }
  } else {
    console.log(`❌ Could not find: "${searchText}"`);
  }
}