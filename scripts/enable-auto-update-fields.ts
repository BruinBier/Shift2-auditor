import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Reading template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Get settings.xml
const settingsXml = zip.file('word/settings.xml');
if (!settingsXml) {
  console.error('settings.xml not found in template');
  process.exit(1);
}

let settingsContent = settingsXml.asText();

console.log('Adding updateFields setting...');

// Check if updateFields already exists
if (settingsContent.includes('<w:updateFields')) {
  console.log('updateFields setting already exists, updating it...');
  // Replace existing setting
  settingsContent = settingsContent.replace(
    /<w:updateFields\s+w:val="(true|false|0|1)"\s*\/>/,
    '<w:updateFields w:val="true"/>'
  );
} else {
  console.log('updateFields setting does not exist, adding it...');
  // Add updateFields setting before closing </w:settings> tag
  settingsContent = settingsContent.replace(
    '</w:settings>',
    '  <w:updateFields w:val="true"/>\n</w:settings>'
  );
}

// Update the ZIP
zip.file('word/settings.xml', settingsContent);

// Create backup
const timestamp = Date.now();
const backupPath = templatePath.replace('.docx', `-BACKUP-${timestamp}.docx`);
fs.writeFileSync(backupPath, content, 'binary');
console.log(`Created backup: ${path.basename(backupPath)}`);

// Save the modified template
const newDocxBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, newDocxBuffer);
console.log('✅ Enabled automatic field updates');
console.log('');
console.log('When you open a generated report in Word, all fields (including TOC)');
console.log('will be automatically updated!');