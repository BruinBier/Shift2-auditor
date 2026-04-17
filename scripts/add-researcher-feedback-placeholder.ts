import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function addResearcherFeedbackPlaceholder() {
  console.log('Adding researcher feedback placeholder to template...');

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
  console.log('Template loaded, searching for location to insert placeholder...');

  // We need to find the text that says something like:
  // "Bij {failedCriteria} succescriteria zijn afwijkingen vastgesteld."
  // And after that paragraph, we want to insert the researcher feedback placeholder

  // Look for the pattern that indicates the end of the second summary paragraph
  const endOfSecondParagraphPattern = /Bij\s+\{failedCriteria\}\s+succescriteria\s+zijn\s+afwijkingen\s+vastgesteld\./i;

  if (!xmlContent.match(endOfSecondParagraphPattern)) {
    console.error('Could not find the end of second paragraph pattern');
    console.log('Searching for alternative patterns...');

    // Try to find by looking for the advice paragraph
    const advicePattern = /Wij\s+adviseren\s+om\s+formuliercontent/i;
    if (xmlContent.match(advicePattern)) {
      console.log('Found advice paragraph, will insert feedback before it');
    } else {
      throw new Error('Could not find insertion point for researcher feedback placeholder');
    }
  }

  // In Word XML, paragraphs are wrapped in <w:p> tags
  // We need to find the paragraph containing our text and insert a new paragraph after it
  // This is complex because of XML structure, so we'll look for a safe insertion point

  // Find the closing </w:p> tag after our target text
  // Then insert a new paragraph with the placeholder

  const searchText = 'Bij {failedCriteria} succescriteria zijn afwijkingen vastgesteld.';
  const replacementText = 'Bij {failedCriteria} succescriteria zijn afwijkingen vastgesteld.</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t>{researcherFeedback}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t>';

  // This is a simplified approach - we're looking for the closing tag pattern
  const paragraphPattern = /(Bij\s+\{failedCriteria\}\s+succescriteria\s+zijn\s+afwijkingen\s+vastgesteld\.)([\s\S]*?)<\/w:p>/i;

  const matches = xmlContent.match(paragraphPattern);
  if (matches) {
    console.log('Found insertion point');
    // Insert the researcher feedback paragraph after the current paragraph
    const newParagraph = '</w:p><w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">{researcherFeedback}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">';

    xmlContent = xmlContent.replace(
      paragraphPattern,
      (match, text, rest) => {
        return text + rest + '</w:p>' + newParagraph.substring(0, newParagraph.length - '<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">'.length);
      }
    );
  } else {
    console.warn('Could not find exact match, trying alternative approach...');

    // Alternative: look for "Wij adviseren" and insert before it
    const advicePattern = /(Wij\s+adviseren\s+om\s+formuliercontent[\s\S]*?)<w:p>/i;
    if (xmlContent.match(advicePattern)) {
      console.log('Inserting feedback before advice paragraph');
      xmlContent = xmlContent.replace(
        advicePattern,
        '<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">{researcherFeedback}</w:t></w:r></w:p>$1<w:p>'
      );
    } else {
      throw new Error('Could not find suitable insertion point');
    }
  }

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

  console.log('✓ Researcher feedback placeholder added successfully!');
  console.log('\nThe placeholder {researcherFeedback} has been added to the summary section.');
}

// Run the script
addResearcherFeedbackPlaceholder().catch((error) => {
  console.error('Error adding placeholder:', error);
  process.exit(1);
});