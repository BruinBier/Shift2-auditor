import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTemplateText() {
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

  console.log('Original length:', xmlContent.length);

  // Replace "online formulieren" with "formulieren"
  const before = xmlContent;
  xmlContent = xmlContent.replace(/online formulieren/g, 'formulieren');

  if (before === xmlContent) {
    console.log('No changes made - "online formulieren" not found');
  } else {
    console.log('Replaced "online formulieren" with "formulieren"');

    // Update the ZIP
    zip.file('word/document.xml', xmlContent);

    // Save the updated template
    const updatedBuffer = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Backup the original
    const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
    fs.copyFileSync(templatePath, backupPath);
    console.log('Backed up original to:', backupPath);

    // Write the updated template
    fs.writeFileSync(templatePath, updatedBuffer);
    console.log('Updated template saved!');
  }
}

fixTemplateText().catch(console.error);