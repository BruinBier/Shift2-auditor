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
    console.error('document.xml not found in template');
    return;
  }

  let xmlContent = documentXml.asText();

  console.log('Original XML length:', xmlContent.length);

  // Find {reportIntroHeader}
  const placeholderIndex = xmlContent.indexOf('{reportIntroHeader}');
  console.log('Found {reportIntroHeader} at:', placeholderIndex);

  if (placeholderIndex === -1) {
    console.error('{reportIntroHeader} not found!');
    return;
  }

  // Show context
  const contextStart = Math.max(0, placeholderIndex - 100);
  const contextEnd = Math.min(xmlContent.length, placeholderIndex + 500);
  console.log('\nContext around {reportIntroHeader}:');
  console.log(xmlContent.substring(contextStart, contextEnd));
  console.log('\n---\n');

  // Find and remove everything after {reportIntroHeader} until the next paragraph or specific marker
  // We want to remove: </w:t></w:r><w:r w:rsidR="00D52F32"><w:t xml:space="preserve"> op</w:t></w:r>
  // and the following hyperlink: <w:r w:rsidR="00D961A4"><w:t xml:space="preserve"> </w:t></w:r><w:hyperlink...

  // Strategy: Find the closing tag of the run containing {reportIntroHeader}, then find the next line break (<w:br/>)
  // and remove everything in between

  const placeholderRunEnd = xmlContent.indexOf('</w:r>', placeholderIndex);
  if (placeholderRunEnd === -1) {
    console.error('Could not find end of run containing {reportIntroHeader}');
    return;
  }

  console.log('reportIntroHeader run ends at:', placeholderRunEnd);

  // Find the line break after this
  const lineBreakIndex = xmlContent.indexOf('<w:br/>', placeholderRunEnd);
  if (lineBreakIndex === -1) {
    console.error('Could not find line break after {reportIntroHeader}');
    return;
  }

  console.log('Line break found at:', lineBreakIndex);

  // Remove everything between the end of {reportIntroHeader} run and the line break run
  const toRemove = xmlContent.substring(placeholderRunEnd + '</w:r>'.length, lineBreakIndex);
  console.log('\nRemoving:', toRemove.substring(0, 200));

  xmlContent = xmlContent.substring(0, placeholderRunEnd + '</w:r>'.length) +
               xmlContent.substring(lineBreakIndex);

  console.log('✓ Removed extra content after {reportIntroHeader}');

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

  console.log('\nDone! Template should now only have {reportIntroHeader} without extra text.');
}

fixTemplate().catch(console.error);