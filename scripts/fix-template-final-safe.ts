import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTemplate() {
  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template:', templatePath);

  const templateContent = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(templateContent);

  const documentXml = zip.file('word/document.xml');
  if (!documentXml) {
    console.error('document.xml not found');
    return;
  }

  let xmlContent = documentXml.asText();
  console.log('Original XML length:', xmlContent.length);

  // Find the exact pattern in the XML:
  // <w:t xml:space="preserve">Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van </w:t></w:r><w:r w:rsidR="00D961A4" w:rsidRPr="00D961A4"><w:t>de content van de online formulieren

  const pattern1 = '<w:t xml:space="preserve">Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van </w:t></w:r><w:r w:rsidR="00D961A4" w:rsidRPr="00D961A4"><w:t>de content van de online formulieren';

  const idx = xmlContent.indexOf(pattern1);

  if (idx === -1) {
    console.error('Pattern not found!');
    console.log('Searching for parts...');

    // Try to find the parts separately
    const part1 = 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van ';
    const part2 = 'de content van de online formulieren';

    const idx1 = xmlContent.indexOf(part1);
    const idx2 = xmlContent.indexOf(part2);

    console.log('Part 1 at:', idx1);
    console.log('Part 2 at:', idx2);

    if (idx1 !== -1 && idx2 !== -1) {
      // Show context
      console.log('\nContext around part 1:');
      console.log(xmlContent.substring(idx1 - 50, idx1 + 150));
      console.log('\nContext around part 2:');
      console.log(xmlContent.substring(idx2 - 50, idx2 + 100));

      // Replace both parts
      // First, find the complete section from the start of first <w:t> to the end of second </w:t>
      const textStart1 = xmlContent.lastIndexOf('<w:t', idx1);
      const textEnd2 = xmlContent.indexOf('</w:t>', idx2);

      if (textStart1 !== -1 && textEnd2 !== -1) {
        console.log('\nReplacing from', textStart1, 'to', textEnd2 + 6);
        console.log('Old section:', xmlContent.substring(textStart1, textEnd2 + 6));

        // Replace with just the placeholder in a single text tag
        const replacement = '<w:t xml:space="preserve">{reportIntroHeader}</w:t>';

        xmlContent = xmlContent.substring(0, textStart1) +
                    replacement +
                    xmlContent.substring(textEnd2 + 6);

        console.log('✓ Replaced with:', replacement);
      }
    }

  } else {
    console.log('Found pattern at:', idx);

    // Replace the entire pattern with just {reportIntroHeader}
    const replacement = '<w:t xml:space="preserve">{reportIntroHeader}';

    xmlContent = xmlContent.substring(0, idx) +
                replacement +
                xmlContent.substring(idx + pattern1.length);

    console.log('✓ Replaced intro text with {reportIntroHeader}');
  }

  // Update document.xml
  zip.file('word/document.xml', xmlContent);

  // Generate new template
  const newTemplateContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write updated template
  fs.writeFileSync(templatePath, newTemplateContent);
  console.log('✓ Template saved successfully');
  console.log('New XML length:', xmlContent.length);
}

fixTemplate().catch(console.error);