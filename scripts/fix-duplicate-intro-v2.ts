import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixDuplicateIntro() {
  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template:', templatePath);

  // Read the template (don't restore from backup - we want to keep {reportIntroHeader} and {websiteUrl})
  const templateContent = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(templateContent);

  // Get document.xml
  const documentXml = zip.file('word/document.xml');
  if (!documentXml) {
    console.error('document.xml not found in template');
    return;
  }

  let xmlContent = documentXml.asText();

  console.log('Original XML length:', xmlContent.length);

  // Find {reportIntroHeader}
  const placeholderIndex = xmlContent.indexOf('{reportIntroHeader}');

  if (placeholderIndex === -1) {
    console.error('{reportIntroHeader} not found - run fix-word-template-website-v2.ts first');
    return;
  }

  console.log('Found {reportIntroHeader} at index:', placeholderIndex);

  // Find "Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van "
  const staticTextPattern = 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van ';
  const staticTextIndex = xmlContent.indexOf(staticTextPattern);

  if (staticTextIndex !== -1 && staticTextIndex < placeholderIndex) {
    console.log('Found static text before {reportIntroHeader} at index:', staticTextIndex);

    // Find the run containing the static text
    const runStartSearch = xmlContent.lastIndexOf('<w:r>', staticTextIndex);
    const runStartSearchAlt = xmlContent.lastIndexOf('<w:r ', staticTextIndex);
    const runStart = Math.max(runStartSearch, runStartSearchAlt);

    // Find the closing tag of the text
    const closingTagIndex = xmlContent.indexOf('</w:t>', staticTextIndex);
    const runEnd = xmlContent.indexOf('</w:r>', closingTagIndex);

    if (runStart !== -1 && runEnd !== -1) {
      console.log('Removing first run from', runStart, 'to', runEnd + '</w:r>'.length);

      // Remove the entire run containing "Dit rapport beschrijft..."
      xmlContent = xmlContent.substring(0, runStart) +
                  xmlContent.substring(runEnd + '</w:r>'.length);

      console.log('✓ Removed static intro text');
    }
  }

  // Now find and remove "de content van de formulieren" that appears after {reportIntroHeader}
  const afterTextPattern = 'de content van de formulieren';
  const afterTextIndex = xmlContent.indexOf(afterTextPattern);
  const reportIntroIndex = xmlContent.indexOf('{reportIntroHeader}');

  if (afterTextIndex !== -1 && reportIntroIndex !== -1 && afterTextIndex > reportIntroIndex) {
    console.log('Found "de content van de formulieren" after {reportIntroHeader} at index:', afterTextIndex);

    // Find the run containing this text
    const runStartSearch = xmlContent.lastIndexOf('<w:r>', afterTextIndex);
    const runStartSearchAlt = xmlContent.lastIndexOf('<w:r ', afterTextIndex);
    const runStart = Math.max(runStartSearch, runStartSearchAlt);

    // Find the closing tag
    const closingTagIndex = xmlContent.indexOf('</w:t>', afterTextIndex);
    const runEnd = xmlContent.indexOf('</w:r>', closingTagIndex);

    if (runStart !== -1 && runEnd !== -1) {
      console.log('Removing second run from', runStart, 'to', runEnd + '</w:r>'.length);

      // Remove the entire run
      xmlContent = xmlContent.substring(0, runStart) +
                  xmlContent.substring(runEnd + '</w:r>'.length);

      console.log('✓ Removed "de content van de formulieren" text');
    }
  }

  // Update the document.xml in the ZIP
  zip.file('word/document.xml', xmlContent);

  // Generate the new template
  const newTemplateContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the updated template
  fs.writeFileSync(templatePath, newTemplateContent);
  console.log('✓ Updated template saved');

  console.log('\nDone! The paragraph now contains only {reportIntroHeader}.');
  console.log('The placeholder will expand to: "Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content van de formulieren op {URL}"');
}

fixDuplicateIntro().catch(console.error);