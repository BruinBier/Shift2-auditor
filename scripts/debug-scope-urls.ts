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

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Search for Valkenswaard URLs
const valkenswaardUrl1 = 'https://valkenswaard.mijnafspraakmaken.nl/';
const valkenswaardUrl2 = 'https://iburgerzaken.valkenswaard.nl/';

console.log('\n--- Checking for Valkenswaard URLs ---');
console.log(`URL 1 found: ${xmlContent.includes(valkenswaardUrl1)}`);
console.log(`URL 2 found: ${xmlContent.includes(valkenswaardUrl2)}`);

if (xmlContent.includes(valkenswaardUrl1)) {
  const index = xmlContent.indexOf(valkenswaardUrl1);
  console.log(`\nContext around URL 1 (index ${index}):`);
  console.log(xmlContent.substring(index - 200, index + 300));
}

// Search for "In scope" heading
console.log('\n--- Checking for "In scope" section ---');
const inScopeIndex = xmlContent.indexOf('In scope');
if (inScopeIndex !== -1) {
  console.log(`"In scope" found at index ${inScopeIndex}`);
  console.log('Context:');
  console.log(xmlContent.substring(inScopeIndex - 100, inScopeIndex + 500));
} else {
  console.log('"In scope" not found in template');
}

// Search for "Buiten scope" heading
console.log('\n--- Checking for "Buiten scope" section ---');
const buitenScopeIndex = xmlContent.indexOf('Buiten scope');
if (buitenScopeIndex !== -1) {
  console.log(`"Buiten scope" found at index ${buitenScopeIndex}`);
  console.log('Context:');
  console.log(xmlContent.substring(buitenScopeIndex - 100, buitenScopeIndex + 500));
} else {
  console.log('"Buiten scope" not found in template');
}