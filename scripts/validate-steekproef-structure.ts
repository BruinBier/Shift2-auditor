import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-steekproef.docx'
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

// Find "Volledige steekproef" section
const steekproefIndex = xmlContent.indexOf('Volledige steekproef');
if (steekproefIndex === -1) {
  console.log('✗ "Volledige steekproef" heading not found');
  process.exit(1);
}

console.log('✓ "Volledige steekproef" heading found');

// Get content after the heading (next 5000 chars to see structure)
const afterHeading = xmlContent.substring(steekproefIndex + 100, steekproefIndex + 3000);

// Check for first sample item title
console.log('\n--- Checking structure ---');
if (afterHeading.includes('Stap 1 - Reactieformulier Vernieuwing Speelplek De Stouwe Europaring Oostzijde')) {
  console.log('✓ First sample item title found');

  // Check if URL follows the title
  const titleIndex = afterHeading.indexOf('Stap 1 - Reactieformulier Vernieuwing Speelplek De Stouwe Europaring Oostzijde');
  const afterTitle = afterHeading.substring(titleIndex);

  if (afterTitle.includes('https://www.wierden.nl/form/reactieformulier-vernieuwing-speelplek-de-stouwe-europaring-oostzijde/reactieformulier-vernieuwing-speelplek-de-stouwe-europaring-oostzijde-0')) {
    console.log('✓ URL follows title');

    // Check if URL is a hyperlink
    const urlIndex = afterTitle.indexOf('https://www.wierden.nl/form/reactieformulier-vernieuwing-speelplek-de-stouwe-europaring-oostzijde');
    const beforeUrl = afterTitle.substring(Math.max(0, urlIndex - 200), urlIndex);

    if (beforeUrl.includes('hyperlink') || beforeUrl.includes('Hyperlink')) {
      console.log('✓ URL is formatted as hyperlink');
    } else {
      console.log('✗ URL is NOT formatted as hyperlink');
    }
  } else {
    console.log('✗ URL does NOT follow title');
  }
} else {
  console.log('✗ First sample item title NOT found');
}

// Count how many sample item titles are present
console.log('\n--- Counting sample items ---');
const sampleTitles = [
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
sampleTitles.forEach(title => {
  if (xmlContent.includes(title)) {
    foundCount++;
  }
});

console.log(`Found ${foundCount}/${sampleTitles.length} sample item titles`);

if (foundCount === sampleTitles.length) {
  console.log('\n✓✓✓ All sample items present with correct structure!');
} else {
  console.log(`\n✗✗✗ Missing ${sampleTitles.length - foundCount} sample items`);
}