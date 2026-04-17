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
  let xmlContent = documentXml.asText();

  // Find the second occurrence of "Onderzoek scores" (the real heading)
  const searchText = 'Onderzoek scores';
  const firstIndex = xmlContent.indexOf(searchText);
  const headingIndex = xmlContent.indexOf(searchText, firstIndex + 1);

  console.log(`Found heading at position: ${headingIndex}`);

  // Search for the phrase that appears just before the table
  const tableIntro = 'De tabel hieronder laat per WCAG-principe';
  const introIndex = xmlContent.indexOf(tableIntro, headingIndex);

  if (introIndex !== -1) {
    console.log(`Found table introduction at position: ${introIndex}`);

    // Now find the first table AFTER this introduction
    const searchFrom = introIndex + tableIntro.length;
    const tableStart = xmlContent.indexOf('<w:tbl', searchFrom);

    if (tableStart !== -1) {
      console.log(`Found table start at position: ${tableStart}`);

      // Find the end of this table
      let depth = 0;
      let pos = tableStart;
      let tableEnd = -1;

      while (pos < xmlContent.length && tableEnd === -1) {
        if (xmlContent.substring(pos, pos + 6) === '<w:tbl') {
          depth++;
          pos += 6;
        } else if (xmlContent.substring(pos, pos + 8) === '</w:tbl>') {
          depth--;
          if (depth === 0) {
            tableEnd = pos + 8;
            break;
          }
          pos += 8;
        } else {
          pos++;
        }
      }

      if (tableEnd !== -1) {
        const tableXml = xmlContent.substring(tableStart, tableEnd);
        console.log(`Table length: ${tableXml.length} characters`);

        // Extract all text from table
        const allText = tableXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (allText) {
          console.log('\n=== ALL TEXT IN TABLE ===');
          console.log(allText.map(t => t.replace(/<[^>]+>/g, '')).join('\n'));
        }

        // Save table
        fs.writeFileSync(
          path.join(process.cwd(), 'onderzoek-scores-table-full.xml'),
          tableXml
        );
        console.log('\n✅ Table XML saved to onderzoek-scores-table-full.xml');
      } else {
        console.log('❌ Could not find table end');
      }
    } else {
      console.log('❌ No table found after introduction text');
    }
  } else {
    console.log('❌ Could not find table introduction text');
  }
}