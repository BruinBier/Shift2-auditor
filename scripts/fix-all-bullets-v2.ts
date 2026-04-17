import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

// Read the template
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Get numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('Could not find word/numbering.xml');
  process.exit(1);
}

let numberingContent = numberingXml.asText();

console.log('Fixing ALL abstractNum definitions to have bullet characters...\n');

// Replace ALL empty lvlText values with bullet character
// Pattern: <w:lvlText w:val=""/>
const emptyLvlTextCount = (numberingContent.match(/<w:lvlText w:val=""\/>/g) || []).length;

console.log(`Found ${emptyLvlTextCount} empty lvlText elements`);

if (emptyLvlTextCount === 0) {
  console.log('✅ No empty lvlText elements to fix!');
  process.exit(0);
}

console.log('Replacing all empty lvlText with bullet character "·"...\n');

// Replace all at once
numberingContent = numberingContent.replace(
  /<w:lvlText w:val=""\/>/g,
  '<w:lvlText w:val="·"/>'
);

// Verify
const remainingEmpty = (numberingContent.match(/<w:lvlText w:val=""\/>/g) || []).length;
console.log(`✅ Fixed ${emptyLvlTextCount - remainingEmpty} empty lvlText elements`);

if (remainingEmpty > 0) {
  console.log(`⚠️  Warning: ${remainingEmpty} empty lvlText elements remain`);
}

// Update the ZIP
zip.file('word/numbering.xml', numberingContent);

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('\n💾 Created backup:', path.basename(backupPath));

// Save the modified template
const output = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, output);
console.log('✅ Updated template:', path.basename(templatePath));
console.log('\n✨ Done! All bullet formats now have bullet characters.');