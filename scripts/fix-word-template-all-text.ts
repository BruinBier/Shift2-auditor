import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixWordTemplateAllText() {
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

  // List of replacements to make:
  // 1. "formuliercontent" -> "content" (in samenvatting)
  // 2. "Bij substantiële wijzigingen in de formulieren" -> "Bij substantiële wijzigingen in de content"
  // 3. "Wij adviseren om formuliercontent periodiek te controleren" -> "Wij adviseren om content periodiek te controleren"

  const before = xmlContent;

  // Replace all occurrences
  xmlContent = xmlContent.replace(/formuliercontent/g, 'content');
  xmlContent = xmlContent.replace(/Bij substantiële wijzigingen in de formulieren/g, 'Bij substantiële wijzigingen in de content');

  if (before === xmlContent) {
    console.log('No changes made - text patterns not found');
  } else {
    console.log('Updated the following:');
    console.log('- Changed "formuliercontent" to "content"');
    console.log('- Changed "Bij substantiële wijzigingen in de formulieren" to "Bij substantiële wijzigingen in de content"');

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

fixWordTemplateAllText().catch(console.error);