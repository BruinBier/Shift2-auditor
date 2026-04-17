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

  // Find {reportIntroHeader}
  const placeholderIndex = xmlContent.indexOf('{reportIntroHeader}');

  if (placeholderIndex === -1) {
    console.error('{reportIntroHeader} not found!');
    return;
  }

  console.log('Found {reportIntroHeader} at:', placeholderIndex);

  // Find the end of the run containing {reportIntroHeader}
  const runEnd = xmlContent.indexOf('</w:r>', placeholderIndex);

  if (runEnd === -1) {
    console.error('Run end not found!');
    return;
  }

  console.log('Run ends at:', runEnd);

  // Find the line break after this position
  const lineBreak = xmlContent.indexOf('<w:br/>', runEnd);

  if (lineBreak === -1) {
    console.error('Line break not found!');
    return;
  }

  console.log('Line break at:', lineBreak);

  // Show what we're removing
  const toRemove = xmlContent.substring(runEnd + '</w:r>'.length, lineBreak);
  console.log('\n=== REMOVING ===');
  console.log(toRemove);
  console.log('=================\n');

  // Remove everything between the end of {reportIntroHeader} run and the line break
  xmlContent = xmlContent.substring(0, runEnd + '</w:r>'.length) +
               '<w:r>' +
               xmlContent.substring(lineBreak);

  console.log('✓ Removed extra content after {reportIntroHeader}');

  // Update document.xml
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

  console.log('\n✅ Done! Removed " op" and hyperlink after {reportIntroHeader}');
}

fixTemplate().catch(console.error);