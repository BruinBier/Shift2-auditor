const PizZip = require('pizzip');
const fs = require('fs');

const templatePath = 'templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx';
const backupPath = `${templatePath}-BACKUP-${Date.now()}.docx`;

// Create backup first
console.log('Creating backup...');
fs.copyFileSync(templatePath, backupPath);
console.log(`Backup created: ${backupPath}`);

// Read the template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Get the XML content
let xml = zip.files['word/document.xml'].asText();

console.log('\n=== Current spacing ===');
const currentMatch = xml.match(/<w:spacing w:before="(\d+)"\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:/);
if (currentMatch) {
  console.log(`Current spacing: ${currentMatch[1]} twips (${Math.round(currentMatch[1] / 1440 * 10) / 10} inches)`);
}

// Adjust spacing from 5600 to 6400 (more down)
xml = xml.replace(
  /(<w:spacing w:before=")5600("\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:)/g,
  '$16400$2'
);

console.log('\n=== New spacing ===');
const newMatch = xml.match(/<w:spacing w:before="(\d+)"\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:/);
if (newMatch) {
  console.log(`New spacing: ${newMatch[1]} twips (${Math.round(newMatch[1] / 1440 * 10) / 10} inches)`);
}

// Update the zip file with proper options
zip.file('word/document.xml', xml);

// Generate with proper options to avoid corruption
const buf = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
});

fs.writeFileSync(templatePath, buf);

console.log('\n✅ Spacing adjusted - block moved down more');
console.log(`\nIf there are any issues, restore from: ${backupPath}`);