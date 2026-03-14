import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-report-final.docx'
);

console.log('Reading generated document...');
const content = fs.readFileSync(docPath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Check for "Volledige steekproef" section
console.log('\n--- Checking for "Volledige steekproef" heading ---');
const steekproefIndex = xmlContent.indexOf('Volledige steekproef');
if (steekproefIndex !== -1) {
  console.log('✓ "Volledige steekproef" heading found at index', steekproefIndex);
} else {
  console.log('✗ "Volledige steekproef" heading NOT found');
}

// Check for Wierden sample items
console.log('\n--- Checking for Wierden sample items ---');
const expectedSampleItems = [
  'Stap 1 - Reactieformulier Vernieuwing Speelplek De Stouwe Europaring Oostzijde',
  'Stap 2 - Controleren (Reactieformulier)',
  'Stap3 -voltooid (reactieformulier)',
  'Stap 1 - Gegevens (Aanmelden updates Zenderink)',
  'Stap 2 - Controleren (Aanmelden updates Zenderink)',
  'Stap 3 - Voltooid (Aanmelden updates Zenderink)',
  'Stap 1 - Contactformulier-trouwambtenaar-bert-groothengel/contactformulier-trouwambtenaar-bert-groothengel',
  'Stap 2 - Controleren (Contactformulier trouwambtenaar)',
  'Stap 3 - Voltooid (Contactformulier trouwambtenaar)'
];

let foundCount = 0;
expectedSampleItems.forEach(title => {
  const found = xmlContent.includes(title);
  if (found) {
    foundCount++;
    console.log(`✓ ${title.substring(0, 60)}...`);
  } else {
    console.log(`✗ ${title.substring(0, 60)}...`);
  }
});

console.log(`\n${foundCount}/${expectedSampleItems.length} sample items found`);

// Check for old hardcoded URLs (should NOT be present)
console.log('\n--- Checking for old hardcoded verduursamen URLs (should NOT be present) ---');
const oldUrls = [
  'verduursamen2030.nl/',
  'verduursamen2030.nl/aan-de-slag/',
  'verduursamen2030.nl/lopende-acties/'
];

let oldUrlsFound = 0;
oldUrls.forEach(url => {
  const found = xmlContent.includes(url);
  if (found) {
    oldUrlsFound++;
    console.log(`✗ FOUND (BAD): ${url}`);
  } else {
    console.log(`✓ NOT FOUND (GOOD): ${url}`);
  }
});

if (oldUrlsFound === 0) {
  console.log('\n✓✓✓ All old hardcoded URLs removed!');
} else {
  console.log(`\n✗✗✗ ${oldUrlsFound} old hardcoded URLs still present`);
}