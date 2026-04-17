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

  // Find "Onderzoek scores" heading
  const searchText = 'Onderzoek scores';
  const index = xmlContent.indexOf(searchText);

  if (index !== -1) {
    console.log(`Found "${searchText}" at position:`, index);

    // Extract a large section after this heading to find the table
    const sectionAfter = xmlContent.substring(index, index + 10000);

    // Find the first table after this heading
    const tableStart = sectionAfter.indexOf('<w:tbl');

    if (tableStart !== -1) {
      const tableEnd = sectionAfter.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;
      const tableXml = sectionAfter.substring(tableStart, tableEnd);

      console.log('\nTable found after "Onderzoek scores"');
      console.log('Table length:', tableXml.length);

      // Extract all text from the table
      const textMatches = tableXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

      if (textMatches) {
        console.log('\nText content in table:');
        const texts = textMatches.map(t => t.replace(/<[^>]+>/g, ''));
        texts.forEach((text, i) => {
          console.log(`${i + 1}. "${text}"`);
        });

        // Try to identify table structure by rows
        const rows = tableXml.match(/<w:tr[^>]*>.*?<\/w:tr>/g);
        console.log(`\nNumber of rows: ${rows ? rows.length : 0}`);

        if (rows) {
          rows.forEach((row, i) => {
            const cellTexts = row.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
            if (cellTexts) {
              console.log(`\nRow ${i + 1}:`, cellTexts.map(t => t.replace(/<[^>]+>/g, '')).join(' | '));
            }
          });
        }
      }

      // Save table XML for inspection
      fs.writeFileSync(
        path.join(process.cwd(), 'onderzoek-scores-table.xml'),
        tableXml
      );
      console.log('\n✅ Table XML saved to onderzoek-scores-table.xml');
    } else {
      console.log('\n❌ No table found after "Onderzoek scores"');
    }
  } else {
    console.log(`❌ Could not find: "${searchText}"`);
  }
}