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

  // Search for text around the problem area
  const searchText1 = 'Afbakening van het deelonderzoek';
  const searchText2 = 'Succescriteria beoordeeld in het technisch deelonderzoek';

  const index1 = xmlContent.indexOf(searchText1);
  const index2 = xmlContent.indexOf(searchText2);

  if (index1 !== -1 && index2 !== -1) {
    console.log(`Found "${searchText1}" at position:`, index1);
    console.log(`Found "${searchText2}" at position:`, index2);

    // Extract the section between these two texts
    const sectionBetween = xmlContent.substring(index1, index2);

    // Count page breaks in this section
    const pageBreaks = sectionBetween.match(/<w:br w:type="page"\/>/g);
    console.log('\nPage breaks between these sections:', pageBreaks ? pageBreaks.length : 0);

    if (pageBreaks) {
      // Show context around each page break
      pageBreaks.forEach((_, i) => {
        const breakIndex = sectionBetween.indexOf('<w:br w:type="page"/>', i > 0 ? sectionBetween.indexOf('<w:br w:type="page"/>') + 1 : 0);
        const contextBefore = sectionBetween.substring(Math.max(0, breakIndex - 300), breakIndex);
        const contextAfter = sectionBetween.substring(breakIndex, breakIndex + 300);

        console.log(`\n=== Page Break ${i + 1} ===`);
        console.log('Before:', contextBefore.substring(contextBefore.length - 150));
        console.log('After:', contextAfter.substring(0, 150));
      });

      console.log('\n\n✅ FIXING: Removing page break(s) between these sections...');

      // Remove page breaks between index1 and index2
      let newXmlContent = xmlContent.substring(0, index1) +
                          sectionBetween.replace(/<w:br w:type="page"\/>/g, '') +
                          xmlContent.substring(index2);

      // Update the ZIP with modified XML
      zip.file('word/document.xml', newXmlContent);

      // Save the modified template
      const outputPath = path.join(
        process.cwd(),
        'templates',
        'formulieren',
        'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
      );

      // Create backup first
      const backupPath = outputPath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
      fs.writeFileSync(backupPath, templateContent, 'binary');
      console.log(`\n📦 Backup created: ${path.basename(backupPath)}`);

      // Save fixed template
      const fixedContent = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      fs.writeFileSync(outputPath, fixedContent);
      console.log(`✅ Fixed template saved: ${path.basename(outputPath)}`);
      console.log(`\nRemoved ${pageBreaks.length} page break(s)`);
    } else {
      console.log('\n⚠️  No page breaks found between these sections in the template.');
      console.log('The blank page might be caused by something else.');

      // Check for excessive empty paragraphs
      const emptyParas = sectionBetween.match(/<w:p[^>]*>\s*<w:pPr>.*?<\/w:pPr>\s*<\/w:p>/g);
      console.log('Empty paragraphs between sections:', emptyParas ? emptyParas.length : 0);
    }
  } else {
    if (index1 === -1) console.log(`❌ Could not find: "${searchText1}"`);
    if (index2 === -1) console.log(`❌ Could not find: "${searchText2}"`);
  }
}