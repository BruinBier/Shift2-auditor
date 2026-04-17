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

// Fix 1: Replace {projectSubject} after "Opdrachtgever:" with {clientName}
const fix1Before = xml.includes('Opdrachtgever:</w:t></w:r><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve"> {projectSubject}');
xml = xml.replace(
  /(Opdrachtgever:<\/w:t><\/w:r><w:r><w:rPr><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t xml:space="preserve">\s*){projectSubject}/g,
  '$1{clientName}'
);
const fix1After = xml.includes('Opdrachtgever:</w:t></w:r><w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve"> {clientName}');
console.log(`\nFix 1 - Opdrachtgever field: ${fix1Before && fix1After ? '✅ Applied' : '⚠️ Not applied'}`);

// Fix 2: Reduce spacing before Opdrachtgever block
const fix2Before = xml.includes('w:before="8040"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Opdrachtgever:');
xml = xml.replace(
  /(<w:spacing w:before=")8040("\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:)/g,
  '$13600$2'
);
const fix2After = xml.includes('w:before="3600"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Opdrachtgever:');
console.log(`Fix 2 - Spacing reduction: ${fix2Before && fix2After ? '✅ Applied' : '⚠️ Not applied'}`);

console.log('\n=== After fixes ===');
const afterMatch = xml.match(/.{0,150}Opdrachtgever:.{0,150}/);
console.log(afterMatch ? afterMatch[0] : 'Not found');

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
console.log(`\nIf there are any issues, restore from: ${backupPath}`);