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

  const tableIntro = 'De tabel hieronder laat per WCAG-principe';
  const introIndex = xmlContent.indexOf(tableIntro);

  if (introIndex !== -1) {
    const chunk = xmlContent.substring(introIndex, introIndex + 50000);
    const tableStartRel = chunk.indexOf('<w:tbl');
    const tableEndRel = chunk.indexOf('</w:tbl>', tableStartRel);
    const tableXml = chunk.substring(tableStartRel, tableEndRel + 8);

    // Extract all rows
    const rows = tableXml.match(/<w:tr[^>]*>[\s\S]*?<\/w:tr>/g);

    if (rows) {
      console.log(`Total rows in table: ${rows.length}\n`);

      rows.forEach((row, i) => {
        console.log(`\n=== ROW ${i + 1} ===`);

        // Extract all text from this row
        const textMatches = row.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (textMatches) {
          const texts = textMatches.map(t => t.replace(/<[^>]+>/g, ''));
          console.log('Content:', texts.join(' | '));
        }

        // Save row 2 (Waarneembaar row) for inspection
        if (i === 1) {
          fs.writeFileSync(
            path.join(process.cwd(), 'scores-template-row.xml'),
            row
          );
          console.log('✅ Saved row 2 to scores-template-row.xml');
        }
      });
    }
  }
}