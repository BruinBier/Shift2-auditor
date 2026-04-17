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

console.log('\n=== Current state ===');
const currentMatch = xml.match(/.{0,150}Opdrachtgever:.{0,150}/);
console.log(currentMatch ? currentMatch[0] : 'Not found');

// Fix 1: Replace {clientName} with {opdrachtgeverNaam}
const fix1Before = xml.includes('{clientName}');
xml = xml.replace(/{clientName}/g, '{opdrachtgeverNaam}');
const fix1After = xml.includes('{opdrachtgeverNaam}');
console.log(`\nFix 1 - Use opdrachtgeverNaam: ${fix1Before && fix1After ? '✅ Applied' : '⚠️ Not applied'}`);

// Fix 2: Adjust spacing from 3600 to 4800 (bit lower than before, but not too much)
const fix2Before = xml.includes('w:before="3600"');
xml = xml.replace(
  /(<w:spacing w:before=")3600("\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:)/g,
  '$14800$2'
);
const fix2After = xml.includes('w:before="4800"');
console.log(`Fix 2 - Spacing adjustment (3600 → 4800): ${fix2Before && fix2After ? '✅ Applied' : '⚠️ Not applied'}`);

console.log('\n=== After fixes ===');
const afterMatch = xml.match(/.{0,150}Opdrachtgever:.{0,150}/);
console.log(afterMatch ? afterMatch[0] : 'Not found');

console.log('\nSpacing: 4800 twips = 240 points = 3.33 inches (~8.5cm)');

// Update the zip file with proper options
zip.file('word/document.xml', xml);

// Generate with proper options to avoid corruption
const buf = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }
});

fs.writeFileSync(templatePath, buf);

console.log('\n✅ Template fixed successfully!');
console.log(`\nChanges:`);
console.log(`  - Opdrachtgever now uses {opdrachtgeverNaam}`);
console.log(`  - Spacing adjusted to 4800 twips (between original and previous fix)`);
console.log(`\nIf there are any issues, restore from: ${backupPath}`);