/**
 * Convert square bracket placeholders to curly brace placeholders for API
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../WCAG_sjabloon.docx');
const OUTPUT_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');
const BACKUP_PATH = path.join(__dirname, '../WCAG_sjabloon-BACKUP-' + Date.now() + '.docx');

console.log('🔄 Converting placeholders from [brackets] to {curlyBraces}...\n');

// Backup
console.log('📦 Creating backup...');
fs.copyFileSync(INPUT_PATH, BACKUP_PATH);
console.log(`✅ Backup: ${path.basename(BACKUP_PATH)}\n`);

// Read template
const content = fs.readFileSync(INPUT_PATH, 'binary');
const zip = new PizZip(content);
let documentXml = zip.file('word/document.xml').asText();

console.log('📝 Replacing placeholders...\n');

// Mapping from [Old] to {new}
const replacements = [
  // Title page
  { from: '[Gemeente]', to: '{projectSubject}' },
  { from: '[Opdrachtgever]', to: '{opdrachtgeverNaam}' },
  { from: '[Website]', to: '{websiteUrl}' },
  { from: '[Datum]', to: '{reportDate}' },
  { from: '[Versie]', to: '{version}' },

  // Summary section
  { from: '[Samenvatting van de resultaten]', to: '' }, // Will be inserted dynamically

  // About section
  { from: '[Beschrijving van scope en methode]', to: '{aboutResearchText}' },

  // Results
  { from: '[Aantal]', to: '{totalCriteria}' },
  { from: '[Aantal voldoet]', to: '{passedCriteria}' },
  { from: '[Aantal afwijkingen]', to: '{failedCriteria}' },
  { from: '[Percentage]', to: '{percentage}' },

  // Findings - these will be replaced dynamically, but add placeholders for structure
  { from: '[Nummer]', to: '[BEVINDING_NUMMER]' },
  { from: '[SC nummer + naam]', to: '[SC_CODE_NAAM]' },
  { from: '[URL]', to: '[LOCATIE_URL]' },
  { from: '[Beschrijving probleem]', to: '[PROBLEEM_BESCHRIJVING]' },
  { from: '[Advies]', to: '[BEVINDING_ADVIES]' },

  // Other sections
  { from: '[Eventuele aanvullende opmerkingen]', to: '{conclusionText}' },
  { from: '[Aanbevelingen voor borging en vervolg]', to: '{continuityAdvice1}\n\n{continuityAdvice2}' },
  { from: '[Scope, steekproef en methode]', to: '{scopeInfo}\n\n{sampleInfo}\n\n{methodologyDetailText}' },

  // Already done by previous script
  // { from: 'WCAG 2.2', to: '{standard}' },
];

let changeCount = 0;
replacements.forEach(({ from, to }) => {
  if (documentXml.includes(from)) {
    const count = (documentXml.match(new RegExp(escapeRegex(from), 'g')) || []).length;
    console.log(`  ✓ Replacing "${from}" → "${to}" (${count} occurrence(s))`);
    documentXml = documentXml.split(from).join(to);
    changeCount += count;
  }
});

console.log(`\n✅ Made ${changeCount} replacements\n`);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Update zip
zip.file('word/document.xml', documentXml);

// Save
const newContent = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(OUTPUT_PATH, newContent);

console.log(`💾 Saved to: ${OUTPUT_PATH}\n`);

console.log('📋 Summary:');
console.log('   ✓ Converted square brackets [] to curly braces {}');
console.log('   ✓ Mapped placeholders to API field names');
console.log('   ✓ Preserved original template structure');
console.log('   ✓ Ready to use with API\n');

console.log('⚠️  IMPORTANT Next Steps:');
console.log('   1. Open the template in Word');
console.log('   2. Add bookmark "_Toc_Samenvatting" to the "Samenvatting" heading');
console.log('   3. Make sure there is a table with "Voldoet" in the header');
console.log('   4. The Bevindingen section will be generated dynamically');
console.log('   5. Test by generating a report from the app\n');

console.log('✨ Done!');

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}