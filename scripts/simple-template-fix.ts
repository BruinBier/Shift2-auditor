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

  // Simple string replacements - keeping the XML structure intact

  // Replace "de content van de online formulieren" with "{reportIntroHeader}"
  // This keeps the existing XML structure completely intact
  const oldText = 'de content van de online formulieren';
  const newText = '{reportIntroHeader}';

  if (xmlContent.includes(oldText)) {
    xmlContent = xmlContent.replace(oldText, newText);
    console.log('✓ Replaced "' + oldText + '" with "' + newText + '"');
  } else {
    console.log('❌ Could not find "' + oldText + '"');
  }

  // Now we need to also remove "Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van "
  // since that's part of what reportIntroHeader will provide
  const introPrefix = 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van ';

  // Find this text and replace it with empty string, but only if it appears before {reportIntroHeader}
  const reportIntroIdx = xmlContent.indexOf('{reportIntroHeader}');
  const introPrefixIdx = xmlContent.lastIndexOf(introPrefix, reportIntroIdx);

  if (introPrefixIdx !== -1 && introPrefixIdx < reportIntroIdx) {
    // We need to replace the text within the <w:t> tag
    // Find the <w:t> tag that contains this text
    const textTagStart = xmlContent.lastIndexOf('<w:t', introPrefixIdx);
    const textTagContentStart = xmlContent.indexOf('>', textTagStart) + 1;
    const textTagEnd = xmlContent.indexOf('</w:t>', introPrefixIdx);

    // Replace the text content
    const before = xmlContent.substring(0, textTagContentStart);
    const after = xmlContent.substring(textTagEnd);
    xmlContent = before + after;

    console.log('✓ Removed intro prefix text');
  }

  // Update document.xml
  zip.file('word/document.xml', xmlContent);

  // Generate new template with same compression settings as original
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