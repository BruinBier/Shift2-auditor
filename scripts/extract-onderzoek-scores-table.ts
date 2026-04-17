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

  // Find the second occurrence (the real heading)
  const searchText = 'Onderzoek scores';
  const firstIndex = xmlContent.indexOf(searchText);
  const index = xmlContent.indexOf(searchText, firstIndex + 1);

  console.log(`Found heading at position: ${index}`);

  const contextAfter = xmlContent.substring(index, index + 10000);
  const tableStart = contextAfter.indexOf('<w:tbl');

  if (tableStart !== -1) {
    const tableEnd = contextAfter.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;
    const tableXml = contextAfter.substring(tableStart, tableEnd);

    console.log('\n=== TABLE STRUCTURE ===\n');

    // Extract rows
    const rows = tableXml.match(/<w:tr[^>]*>[\s\S]*?<\/w:tr>/g);

    if (rows) {
      console.log(`Number of rows: ${rows.length}\n`);

      rows.forEach((row, i) => {
        const cellTexts = row.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (cellTexts) {
          const texts = cellTexts.map(t => t.replace(/<[^>]+>/g, ''));
          console.log(`Row ${i + 1}: ${texts.join(' | ')}`);
        } else {
          console.log(`Row ${i + 1}: (empty)`);
        }
      });
    }

    // Save table XML
    fs.writeFileSync(
      path.join(process.cwd(), 'onderzoek-scores-table.xml'),
      tableXml
    );
    console.log('\n✅ Table XML saved to onderzoek-scores-table.xml');
  }
}