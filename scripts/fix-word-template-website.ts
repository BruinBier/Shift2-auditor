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
  // This will contain the full intro text with the website URL
  const toegankelijkheidPattern = 'toegankelijkheid van ';
  const toegankelijkheidIndex = xmlContent.indexOf(toegankelijkheidPattern);

  if (toegankelijkheidIndex !== -1) {
    console.log('Found "toegankelijkheid van " at index:', toegankelijkheidIndex);

    // Find the closing </w:t> tag after this text
    const closingTagIndex = xmlContent.indexOf('</w:t>', toegankelijkheidIndex);

    if (closingTagIndex !== -1) {
      // Find the end of the run (</w:r>)
      const runEndIndex = xmlContent.indexOf('</w:r>', closingTagIndex);

      if (runEndIndex !== -1) {
        // Insert {reportIntroHeader} as a new run after this run
        const newRun = '<w:r><w:t>{reportIntroHeader}</w:t></w:r>';
        xmlContent = xmlContent.substring(0, runEndIndex + '</w:r>'.length) +
                     newRun +
                     xmlContent.substring(runEndIndex + '</w:r>'.length);

        console.log('✓ Added {reportIntroHeader} after "toegankelijkheid van "');
      }
    }
  } else {
    console.log('⚠ "toegankelijkheid van " not found in template');
  }

  // Fix 2: Add {websiteUrl} after "Website: "
  // Find all occurrences of "Website:" and replace with "Website: {websiteUrl}"
  const websitePattern = '>Website:';
  let searchIndex = 0;
  let fixedWebsiteCount = 0;

  while ((searchIndex = xmlContent.indexOf(websitePattern, searchIndex)) !== -1) {
    console.log('Found "Website:" at index:', searchIndex);

    // Check if this is on the first page by looking at context
    // We want the one near opdrachtgeverNaam, reportDate, etc.
    const contextBefore = xmlContent.substring(Math.max(0, searchIndex - 500), searchIndex);
    const contextAfter = xmlContent.substring(searchIndex, searchIndex + 500);

    // If it's near "Opdrachtgever:" or "Datum:" it's likely the right one
    if (contextBefore.includes('Opdrachtgever:') || contextAfter.includes('Datum:') || contextAfter.includes('Raportversie:')) {
      console.log('  → This appears to be on the first page');

      // Find the closing </w:t> tag
      const closingTagIndex = xmlContent.indexOf('</w:t>', searchIndex);

      if (closingTagIndex !== -1) {
        // Find the end of the run
        const runEndIndex = xmlContent.indexOf('</w:r>', closingTagIndex);

        if (runEndIndex !== -1) {
          // Insert " {websiteUrl}" as a new text run after this run
          const newRun = '<w:r><w:t xml:space="preserve"> {websiteUrl}</w:t></w:r>';
          xmlContent = xmlContent.substring(0, runEndIndex + '</w:r>'.length) +
                       newRun +
                       xmlContent.substring(runEndIndex + '</w:r>'.length);

          console.log('✓ Added {websiteUrl} after "Website:"');
          fixedWebsiteCount++;
          searchIndex = runEndIndex + '</w:r>'.length + newRun.length;
        } else {
          searchIndex++;
        }
      } else {
        searchIndex++;
      }
    } else {
      searchIndex++;
    }
  }

  console.log(`Fixed ${fixedWebsiteCount} "Website:" occurrence(s)`);

  // Update the document.xml in the ZIP
  zip.file('word/document.xml', xmlContent);

  // Generate the new template
  const newTemplateContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Create backup of original template
  const backupPath = templatePath.replace('.docx', '.BACKUP.docx');
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, templateContent, 'binary');
    console.log('✓ Created backup at:', backupPath);
  }

  // Write the updated template
  fs.writeFileSync(templatePath, newTemplateContent);
  console.log('✓ Updated template saved');

  console.log('\nDone! The template has been updated with:');
  console.log('  - {websiteUrl} after "formulieren op "');
  console.log('  - {websiteUrl} after "Website:"');
}

fixWordTemplate().catch(console.error);