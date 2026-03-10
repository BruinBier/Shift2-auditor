import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function addManagementSummaryPlaceholder() {
  console.log('Adding {managementSummary} placeholder to template...');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template from:', templatePath);

  // Read the template file
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  // Get the main document XML
  const doc = zip.file('word/document.xml');
  if (!doc) {
    throw new Error('Could not find word/document.xml in template');
  }

  let xmlContent = doc.asText();
  console.log('Template loaded, searching for summary section...');

  // We need to replace the template text that contains placeholders with a single {managementSummary} placeholder
  // Look for the pattern that starts with "Dit onderzoek is door Shift2 uitgevoerd"
  // and ends with "Bij {failedCriteria} succescriteria zijn afwijkingen vastgesteld."

  // Search for the start pattern
  const startPattern = /Dit onderzoek is door Shift2 uitgevoerd tussen \{dateStart\}/i;
  const endPattern = /Bij \{failedCriteria\} succescriteria zijn afwijkingen vastgesteld\./i;

  const startMatch = xmlContent.match(startPattern);
  const endMatch = xmlContent.match(endPattern);

  if (!startMatch || !endMatch) {
    console.log('Could not find summary section patterns');
    console.log('Start pattern found:', !!startMatch);
    console.log('End pattern found:', !!endMatch);

    // Try alternative: search for any occurrence of the placeholders
    console.log('\nSearching for placeholder locations...');
    const dateStartIdx = xmlContent.indexOf('{dateStart}');
    const failedCriteriaIdx = xmlContent.lastIndexOf('{failedCriteria}');

    if (dateStartIdx === -1 || failedCriteriaIdx === -1) {
      throw new Error('Could not find placeholder positions in template');
    }

    console.log('Found {dateStart} at position:', dateStartIdx);
    console.log('Found {failedCriteria} at position:', failedCriteriaIdx);

    // Get a context window around these positions
    const startContext = xmlContent.substring(Math.max(0, dateStartIdx - 100), dateStartIdx + 100);
    const endContext = xmlContent.substring(Math.max(0, failedCriteriaIdx - 100), failedCriteriaIdx + 100);

    console.log('\nContext around {dateStart}:');
    console.log(startContext);
    console.log('\nContext around {failedCriteria}:');
    console.log(endContext);

    return;
  }

  console.log('Found summary section, replacing with {managementSummary} placeholder...');

  // Find the indices
  const startIdx = startMatch.index!;
  const endIdx = endMatch.index! + endMatch[0].length;

  // Extract the text before and after
  const before = xmlContent.substring(0, startIdx);
  const after = xmlContent.substring(endIdx);

  // Replace with placeholder
  xmlContent = before + '{managementSummary}' + after;

  // Update the document XML
  zip.file('word/document.xml', xmlContent);

  console.log('Writing updated template...');

  // Generate the new Word document
  const newContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the new file
  fs.writeFileSync(templatePath, newContent);

  console.log('✓ Template updated successfully!');
  console.log('\nReplaced summary text with {managementSummary} placeholder');
}

// Run the script
addManagementSummaryPlaceholder().catch((error) => {
  console.error('Error adding placeholder:', error);
  process.exit(1);
});