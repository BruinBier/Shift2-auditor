const PizZip = require('pizzip');
const fs = require('fs');

const templatePath = 'templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx';

// Read the template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Get the XML content
let xml = zip.files['word/document.xml'].asText();

console.log('=== Before fix ===');
const beforeMatch = xml.match(/.{0,100}Opdrachtgever:.{0,100}/);
console.log(beforeMatch ? beforeMatch[0] : 'Not found');

// Fix: Replace {projectSubject} after "Opdrachtgever:" with {clientName}
// We need to be careful to only replace the one after "Opdrachtgever:", not all occurrences
xml = xml.replace(
  /(<w:t>Opdrachtgever:<\/w:t>.*?<w:t xml:space="preserve">\s*){projectSubject}/,
  '$1{clientName}'
);

console.log('\n=== After fix ===');
const afterMatch = xml.match(/.{0,100}Opdrachtgever:.{0,100}/);
console.log(afterMatch ? afterMatch[0] : 'Not found');

// Update the zip file
zip.files['word/document.xml']._data = xml;

// Write back to file
const buf = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(templatePath, buf);

console.log('\n✅ Template fixed! Opdrachtgever now uses {clientName} instead of {projectSubject}');