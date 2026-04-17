const PizZip = require('pizzip');
const fs = require('fs');

const templatePath = 'templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx';

// Read the template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Get the XML content
let xml = zip.files['word/document.xml'].asText();

console.log('=== Searching for spacing before Opdrachtgever ===');
const beforeMatch = xml.match(/.{0,200}Opdrachtgever:.{0,200}/);
console.log(beforeMatch ? beforeMatch[0] : 'Not found');

// Find the spacing value - looking for w:before="8040" which is quite large
const spacingMatch = xml.match(/<w:spacing w:before="(\d+)"\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:/);
if (spacingMatch) {
  console.log(`\nCurrent spacing before Opdrachtgever: ${spacingMatch[1]} twips`);
  console.log(`(${Math.round(spacingMatch[1] / 20)} points / ${Math.round(spacingMatch[1] / 1440)} inches)`);
}

// Reduce spacing from 8040 to something like 4000 (from ~5.6 inches to ~2.8 inches)
// Or maybe 3000 for ~2.1 inches
xml = xml.replace(
  /<w:spacing w:before="8040"\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:/,
  '<w:spacing w:before="3600"/><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Opdrachtgever:'
);

console.log('\n=== After fix ===');
const afterMatch = xml.match(/.{0,200}Opdrachtgever:.{0,200}/);
console.log(afterMatch ? afterMatch[0] : 'Not found');

const newSpacingMatch = xml.match(/<w:spacing w:before="(\d+)"\/><w:jc w:val="right"\/><\/w:pPr><w:r><w:rPr><w:b\/><w:bCs\/><w:sz w:val="22"\/><w:szCs w:val="22"\/><\/w:rPr><w:t>Opdrachtgever:/);
if (newSpacingMatch) {
  console.log(`\nNew spacing before Opdrachtgever: ${newSpacingMatch[1]} twips`);
  console.log(`(${Math.round(newSpacingMatch[1] / 20)} points / ${Math.round(newSpacingMatch[1] / 1440)} inches)`);
}

// Update the zip file
zip.files['word/document.xml']._data = xml;

// Write back to file
const buf = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(templatePath, buf);

console.log('\n✅ Template fixed! Info block spacing reduced');