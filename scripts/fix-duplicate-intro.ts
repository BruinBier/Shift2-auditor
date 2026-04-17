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

  // Restore from backup first
  const backupPath = templatePath.replace('.docx', '.BACKUP.docx');
  if (fs.existsSync(backupPath)) {
    const backupContent = fs.readFileSync(backupPath, 'binary');
    fs.writeFileSync(templatePath, backupContent, 'binary');
    console.log('✓ Restored template from backup');
  }

  // Read the template
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

  // Find the paragraph containing "Dit rapport beschrijft"
  const ditRapportPattern = 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van ';
  const ditRapportIndex = xmlContent.indexOf(ditRapportPattern);

  if (ditRapportIndex !== -1) {
    console.log('Found "Dit rapport beschrijft..." at index:', ditRapportIndex);

    // Find the paragraph start before this text
    const paragraphStart = xmlContent.lastIndexOf('<w:p ', ditRapportIndex);
    const paragraphEnd = xmlContent.indexOf('</w:p>', ditRapportIndex);

    if (paragraphStart !== -1 && paragraphEnd !== -1) {
      console.log('Found paragraph from', paragraphStart, 'to', paragraphEnd);

      // Extract the paragraph content
      const paragraphContent = xmlContent.substring(paragraphStart, paragraphEnd + '</w:p>'.length);

      // Check if this paragraph contains {reportIntroHeader}
      if (paragraphContent.includes('{reportIntroHeader}')) {
        console.log('This paragraph contains {reportIntroHeader} - need to remove static text');

        // Find all text runs in this paragraph
        // We want to remove all runs that contain the static text before {reportIntroHeader}

        // Strategy: Remove the text "Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van "
        // but keep {reportIntroHeader}

        // Find the closing </w:t> tag after the static text
        const closingTagIndex = xmlContent.indexOf('</w:t>', ditRapportIndex);

        if (closingTagIndex !== -1) {
          // Find the run end
          const runEndIndex = xmlContent.indexOf('</w:r>', closingTagIndex);

          if (runEndIndex !== -1) {
            // Find the run start (go backwards from ditRapportIndex)
            const runStartSearch = xmlContent.lastIndexOf('<w:r>', ditRapportIndex);
            const runStartSearchAlt = xmlContent.lastIndexOf('<w:r ', ditRapportIndex);
            const runStart = Math.max(runStartSearch, runStartSearchAlt);

            if (runStart !== -1) {
              console.log('Removing text from', runStart, 'to', runEndIndex + '</w:r>'.length);

              // Remove the entire run containing the static text
              xmlContent = xmlContent.substring(0, runStart) +
                          xmlContent.substring(runEndIndex + '</w:r>'.length);

              console.log('✓ Removed static intro text, keeping only {reportIntroHeader}');
            }
          }
        }
      } else {
        console.log('This paragraph does NOT contain {reportIntroHeader} - skipping');
      }
    }
  } else {
    console.log('Pattern not found - might already be fixed');
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

  console.log('\nDone! Removed duplicate static intro text.');
}

fixDuplicateIntro().catch(console.error);