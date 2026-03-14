import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-report-v3.docx'
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

// Check for "Scope" section (NOT "In scope", just "Scope")
console.log('\n--- Checking for "Scope" section (existing heading) ---');
const scopeIndex = xmlContent.indexOf('>Scope<');
if (scopeIndex !== -1) {
  console.log('✓ "Scope" heading found at index', scopeIndex);
  console.log('\nContext (700 chars after "Scope"):');
  console.log(xmlContent.substring(scopeIndex, scopeIndex + 700));
} else {
  console.log('✗ "Scope" heading NOT found');
}

// Check that there is NO "In scope" heading (we should be using the existing "Scope" heading)
console.log('\n--- Verifying no extra "In scope" heading ---');
const inScopeIndex = xmlContent.indexOf('In scope');
if (inScopeIndex === -1) {
  console.log('✓ No extra "In scope" heading (correct - using existing "Scope" heading)');
} else {
  console.log('✗ Found unwanted "In scope" heading at index', inScopeIndex);
}

// Check for Wierden URLs (actual URLs from database)
console.log('\n--- Checking for Wierden URLs (actual scope URLs from DB) ---');
const wierdenUrls = [
  'https://www.wierden.nl/form/aanmelden-updates-zenderink/gegevens-0-1',
  'https://www.wierden.nl/form/contactformulier-trouwambtenaar-bert-groothengel/contactformulier-trouwambtenaar-bert-groothengel-0',
  'https://www.wierden.nl/form/reactieformulier-vernieuwing-speelplek-de-stouwe-europaring-oostzijde/reactieformulier-vernieuwing-speelplek-de-stouwe-europaring-oostzijde-0'
];

wierdenUrls.forEach(url => {
  const found = xmlContent.includes(url);
  console.log(`${found ? '✓' : '✗'} ${url.substring(0, 80)}...`);
});

// Check for "Buiten scope" section
console.log('\n--- Checking for "Buiten scope" section ---');
const buitenScopeIndex = xmlContent.indexOf('Buiten scope');
if (buitenScopeIndex !== -1) {
  console.log('✗ "Buiten scope" heading still present (should be removed)');
  console.log('Context:');
  console.log(xmlContent.substring(buitenScopeIndex - 100, buitenScopeIndex + 300));
} else {
  console.log('✓ "Buiten scope" heading correctly removed (no out-of-scope URLs)');
}

// Check for old Valkenswaard URLs
console.log('\n--- Checking for old Valkenswaard URLs (should NOT be present) ---');
const oldUrls = [
  'https://valkenswaard.mijnafspraakmaken.nl/',
  'https://iburgerzaken.valkenswaard.nl/'
];

oldUrls.forEach(url => {
  const found = xmlContent.includes(url);
  console.log(`${found ? '✗ FOUND (BAD)' : '✓ NOT FOUND (GOOD)'} ${url}`);
});