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

  // Find ALL occurrences of "Onderzoek scores"
  const searchText = 'Onderzoek scores';
  let index = -1;
  let count = 0;

  while ((index = xmlContent.indexOf(searchText, index + 1)) !== -1) {
    count++;
    console.log(`\n=== Occurrence ${count} at position ${index} ===`);

    // Get context before to see if it's a heading
    const contextBefore = xmlContent.substring(Math.max(0, index - 300), index);
    const contextAfter = xmlContent.substring(index + searchText.length, index + searchText.length + 5000);

    // Check if it's a heading (has pStyle or is in a bookmark)
    const isHeading = contextBefore.includes('pStyle') || contextBefore.includes('bookmarkStart');
    console.log('Appears to be a heading:', isHeading);

    // Look for tables in the next 5000 characters
    const nextTable = contextAfter.indexOf('<w:tbl');
    if (nextTable !== -1) {
      console.log('Table found after this occurrence at relative position:', nextTable);

      // Extract some text from that table
      const tableSection = contextAfter.substring(nextTable, nextTable + 2000);
      const tableCells = tableSection.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (tableCells) {
        console.log('Table content preview:', tableCells.slice(0, 15).map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
      }
    } else {
      console.log('No table found within 5000 chars after this occurrence');
    }
  }

  console.log(`\n\nTotal occurrences of "${searchText}": ${count}`);
}