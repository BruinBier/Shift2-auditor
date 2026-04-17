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

  // Remove the " op" text and hyperlink that comes after {reportIntroHeader}
  // Pattern: {reportIntroHeader}</w:t></w:r><w:r w:rsidR="00D52F32"><w:t xml:space="preserve"> op</w:t></w:r><w:r w:rsidR="00D961A4...hyperlink...

  const reportIntroIdx = xmlContent.indexOf('{reportIntroHeader}');

  if (reportIntroIdx === -1) {
    console.error('{reportIntroHeader} not found!');
    return;
  }

  console.log('Found {reportIntroHeader} at:', reportIntroIdx);

  // Find the closing tags after {reportIntroHeader}
  const closingTag = xmlContent.indexOf('</w:t></w:r>', reportIntroIdx);

  if (closingTag === -1) {
    console.error('Closing tag not found!');
    return;
  }

  console.log('Closing tag at:', closingTag);

  // Find the next paragraph or line break
  const nextParagraph = xmlContent.indexOf('</w:p>', closingTag);
  const nextLineBreak = xmlContent.indexOf('<w:r><w:br/>', closingTag);

  // Use whichever comes first
  let endPoint = nextParagraph;
  if (nextLineBreak !== -1 && (nextParagraph === -1 || nextLineBreak < nextParagraph)) {
    endPoint = nextLineBreak;
  }

  if (endPoint === -1) {
    console.error('Could not find end point!');
    return;
  }

  console.log('End point at:', endPoint);

  // Show what we're removing
  const toRemove = xmlContent.substring(closingTag + '</w:t></w:r>'.length, endPoint);
  console.log('\n=== REMOVING ===');
  console.log(toRemove);
  console.log('=================\n');

  // Remove everything between closing tag and end point
  xmlContent = xmlContent.substring(0, closingTag + '</w:t></w:r>'.length) +
               xmlContent.substring(endPoint);

  console.log('✓ Removed extra content after {reportIntroHeader}');

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