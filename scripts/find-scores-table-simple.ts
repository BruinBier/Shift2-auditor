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

  // Find the phrase unique to the scores table
  const tableIntro = 'De tabel hieronder laat per WCAG-principe';
  const introIndex = xmlContent.indexOf(tableIntro);

  if (introIndex !== -1) {
    console.log('Found table introduction');

    // Extract a large chunk after the intro
    const chunk = xmlContent.substring(introIndex, introIndex + 50000);

    // Find table start
    const tableStartRel = chunk.indexOf('<w:tbl');
    if (tableStartRel !== -1) {
      // Find table end by looking for </w:tbl> after start
      const tableEndRel = chunk.indexOf('</w:tbl>', tableStartRel);

      if (tableEndRel !== -1) {
        const tableXml = chunk.substring(tableStartRel, tableEndRel + 8);

        console.log('Table found, length:', tableXml.length);

        // Extract all text
        const allText = tableXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (allText) {
          const texts = allText.map(t => t.replace(/<[^>]+>/g, '').trim()).filter(t => t);
          console.log('\n=== TABLE CONTENT ===');
          texts.forEach((text, i) => {
            console.log(`${i + 1}. "${text}"`);
          });
        }

        // Save
        fs.writeFileSync(
          path.join(process.cwd(), 'onderzoek-scores-table-correct.xml'),
          tableXml
        );
        console.log('\n✅ Saved to onderzoek-scores-table-correct.xml');
      }
    }
  }
}