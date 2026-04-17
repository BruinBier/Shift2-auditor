import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixWordTemplate() {
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

  // Fix 1: Add {reportIntroHeader} after "toegankelijkheid van "
  const toegankelijkheidPattern = 'toegankelijkheid van ';
  const toegankelijkheidIndex = xmlContent.indexOf(toegankelijkheidPattern);

  if (toegankelijkheidIndex !== -1) {
    console.log('Found "toegankelijkheid van " at index:', toegankelijkheidIndex);

    const closingTagIndex = xmlContent.indexOf('</w:t>', toegankelijkheidIndex);
    if (closingTagIndex !== -1) {
      const runEndIndex = xmlContent.indexOf('</w:r>', closingTagIndex);
      if (runEndIndex !== -1) {
        const newRun = '<w:r><w:t>{reportIntroHeader}</w:t></w:r>';
        xmlContent = xmlContent.substring(0, runEndIndex + '</w:r>'.length) +
                     newRun +
                     xmlContent.substring(runEndIndex + '</w:r>'.length);

        console.log('✓ Added {reportIntroHeader} after "toegankelijkheid van "');
      }
    }
  }

  // Fix 2: Replace hyperlink text after "Website" with {websiteUrl}
  const websitePattern = 'Website</w:t>';
  const websiteIndex = xmlContent.indexOf(websitePattern);

  if (websiteIndex !== -1) {
    console.log('Found "Website" at index:', websiteIndex);

    // Check if this is on the first page
    const contextBefore = xmlContent.substring(Math.max(0, websiteIndex - 1000), websiteIndex);

    if (contextBefore.includes('opdrachtgeverNaam')) {
      console.log('  → This appears to be on the first page');

      // Find the next hyperlink after "Website"
      const hyperlinkStart = xmlContent.indexOf('<w:hyperlink', websiteIndex);

      if (hyperlinkStart !== -1 && hyperlinkStart < websiteIndex + 300) {
        const hyperlinkEnd = xmlContent.indexOf('</w:hyperlink>', hyperlinkStart);

        if (hyperlinkEnd !== -1) {
          // Extract the hyperlink section
          const hyperlinkSection = xmlContent.substring(hyperlinkStart, hyperlinkEnd + '</w:hyperlink>'.length);

          // Find <w:t>...</w:t> inside hyperlink
          const textStart = hyperlinkSection.indexOf('<w:t');
          const textContentStart = hyperlinkSection.indexOf('>', textStart) + 1;
          const textEnd = hyperlinkSection.indexOf('</w:t>', textStart);

          if (textStart !== -1 && textEnd !== -1) {
            // Build new hyperlink with {websiteUrl}
            const newHyperlink = hyperlinkSection.substring(0, textContentStart) +
                                '{websiteUrl}' +
                                hyperlinkSection.substring(textEnd);

            // Replace in XML
            xmlContent = xmlContent.substring(0, hyperlinkStart) +
                        newHyperlink +
                        xmlContent.substring(hyperlinkEnd + '</w:hyperlink>'.length);

            console.log('✓ Replaced hyperlink text with {websiteUrl} after "Website:"');
          }
        }
      }
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

  console.log('\nDone! The template has been updated with:');
  console.log('  - {reportIntroHeader} after "toegankelijkheid van "');
  console.log('  - {websiteUrl} in hyperlink after "Website:"');
}

fixWordTemplate().catch(console.error);