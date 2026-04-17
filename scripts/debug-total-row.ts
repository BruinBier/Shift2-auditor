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

    const rows = tableXml.match(/<w:tr[^>]*>[\s\S]*?<\/w:tr>/g);

    if (rows && rows.length >= 6) {
      console.log('=== TOTAAL ROW (row 6) ===\n');
      const totalRow = rows[5];
      
      const textMatches = totalRow.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      
      if (textMatches) {
        console.log('Text matches in total row:');
        textMatches.forEach((match, i) => {
          const text = match.replace(/<[^>]+>/g, '');
          console.log(`  [${i}]: "${text}"`);
        });
      }

      console.log('\n\nExpected replacement:');
      console.log('  [1]: "11 /" (Niveau A approved)');
      console.log('  [2]: " 19" (Niveau A tested)');
      console.log('  [3]: "7 /" (Niveau AA approved)');
      console.log('  [4]: " 11" (Niveau AA tested)');
      console.log('  [5]: "18/" (Total approved)');
      console.log('  [6]: " 30" (Total tested)');
    }
  }
}
