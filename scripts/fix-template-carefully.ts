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

  // STEP 1: Replace the entire intro paragraph with just {reportIntroHeader}
  // Find: "Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van </w:t></w:r><w:r w:rsidR="00D961A4" w:rsidRPr="00D961A4"><w:t>de content van de online formulieren"

  const pattern1 = 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van ';
  const idx1 = xmlContent.indexOf(pattern1);

  if (idx1 === -1) {
    console.error('Pattern 1 not found!');
    return;
  }

  console.log('Found intro text at:', idx1);

  // Find the opening <w:t> tag before this text
  const textTagStart = xmlContent.lastIndexOf('<w:t', idx1);
  const textTagContentStart = xmlContent.indexOf('>', textTagStart) + 1;

  // Find where "de content van de online formulieren" ends
  const pattern2 = 'de content van de online formulieren';
  const idx2 = xmlContent.indexOf(pattern2, idx1);

  if (idx2 === -1) {
    console.error('Pattern 2 not found!');
    return;
  }

  // Find the closing </w:t> after "formulieren"
  const textTagEnd = xmlContent.indexOf('</w:t>', idx2);

  if (textTagEnd === -1) {
    console.error('Could not find closing tag!');
    return;
  }

  console.log('Will replace from', textTagContentStart, 'to', textTagEnd);
  console.log('Old text:', xmlContent.substring(textTagContentStart, textTagEnd));

  // Replace with just {reportIntroHeader}
  xmlContent = xmlContent.substring(0, textTagContentStart) +
               '{reportIntroHeader}' +
               xmlContent.substring(textTagEnd);

  console.log('✓ Replaced intro text with {reportIntroHeader}');

  // STEP 2: Find Website hyperlink and replace its text with {websiteUrl}
  const websitePattern = 'Website</w:t>';
  const websiteIdx = xmlContent.indexOf(websitePattern);

  if (websiteIdx === -1) {
    console.error('Website label not found!');
    return;
  }

  console.log('Found Website at:', websiteIdx);

  // Find the next hyperlink
  const hyperlinkStart = xmlContent.indexOf('<w:hyperlink', websiteIdx);

  if (hyperlinkStart === -1 || hyperlinkStart > websiteIdx + 500) {
    console.error('Hyperlink not found near Website!');
    return;
  }

  const hyperlinkEnd = xmlContent.indexOf('</w:hyperlink>', hyperlinkStart);

  if (hyperlinkEnd === -1) {
    console.error('Hyperlink end not found!');
    return;
  }

  // Extract hyperlink section
  const hyperlinkSection = xmlContent.substring(hyperlinkStart, hyperlinkEnd + '</w:hyperlink>'.length);

  // Find <w:t>...</w:t> in hyperlink and replace the content
  const hyperlinkTextStart = hyperlinkSection.indexOf('<w:t');
  const hyperlinkTextContentStart = hyperlinkSection.indexOf('>', hyperlinkTextStart) + 1;
  const hyperlinkTextEnd = hyperlinkSection.indexOf('</w:t>', hyperlinkTextStart);

  if (hyperlinkTextStart === -1 || hyperlinkTextEnd === -1) {
    console.error('Could not find text in hyperlink!');
    return;
  }

  console.log('Old hyperlink text:', hyperlinkSection.substring(hyperlinkTextContentStart, hyperlinkTextEnd));

  // Build new hyperlink with {websiteUrl}
  const newHyperlink = hyperlinkSection.substring(0, hyperlinkTextContentStart) +
                       '{websiteUrl}' +
                       hyperlinkSection.substring(hyperlinkTextEnd);

  // Replace in XML
  xmlContent = xmlContent.substring(0, hyperlinkStart) +
               newHyperlink +
               xmlContent.substring(hyperlinkEnd + '</w:hyperlink>'.length);

  console.log('✓ Replaced hyperlink text with {websiteUrl}');

  // Update document.xml in ZIP
  zip.file('word/document.xml', xmlContent);

  // Generate new template
  const newTemplateContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });

  // Write updated template
  fs.writeFileSync(templatePath, newTemplateContent);
  console.log('✓ Template saved successfully');
  console.log('New XML length:', xmlContent.length);

  console.log('\n✅ Done! Template updated with:');
  console.log('   - {reportIntroHeader} replacing intro paragraph');
  console.log('   - {websiteUrl} in Website hyperlink');
}

fixTemplate().catch(console.error);