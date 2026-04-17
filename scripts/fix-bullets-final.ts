import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

// Read the template
const zip = new AdmZip(templatePath);
const numberingEntry = zip.getEntry('word/numbering.xml');

if (!numberingEntry) {
  console.error('Could not find word/numbering.xml');
  process.exit(1);
}

let numberingXml = numberingEntry.getData().toString('utf8');

// The "empty" lvlText actually contains character U+F0A7 (61607) - a Wingdings bullet
const wingdingsBullet = String.fromCharCode(61607);

// Count Wingdings bullets
const before = (numberingXml.match(new RegExp(`<w:lvlText w:val="${wingdingsBullet}"/>`, 'g')) || []).length;
console.log(`Found ${before} Wingdings bullet characters (U+F0A7)\n`);

if (before === 0) {
  console.log('✅ No Wingdings bullets to replace!');
  process.exit(0);
}

// Replace all Wingdings bullets with Symbol bullet ·
console.log('Replacing all Wingdings bullet characters with Symbol bullet "·"...');
numberingXml = numberingXml.replace(new RegExp(`<w:lvlText w:val="${wingdingsBullet}"/>`, 'g'), '<w:lvlText w:val="·"/>');

// Count after
const after = (numberingXml.match(new RegExp(`<w:lvlText w:val="${wingdingsBullet}"/>`, 'g')) || []).length;
console.log(`✅ Replaced ${before - after} Wingdings bullets with Symbol bullets`);

if (after > 0) {
  console.log(`⚠️  Warning: ${after} empty lvlText elements remain`);
}

// Update zip
zip.updateFile('word/numbering.xml', Buffer.from(numberingXml, 'utf8'));

// Backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`\n💾 Created backup: ${path.basename(backupPath)}`);

// Save
zip.writeZip(templatePath);
console.log(`✅ Updated template: ${path.basename(templatePath)}`);
console.log('\n✨ Done! All bullet formats now have bullet characters.');