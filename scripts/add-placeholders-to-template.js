/**
 * Script to analyze and add placeholders to WCAG_sjabloon.docx
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../WCAG_sjabloon.docx');
const BACKUP_PATH = path.join(__dirname, '../WCAG_sjabloon-BACKUP-' + Date.now() + '.docx');
const OUTPUT_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');

console.log('📋 Analyzing WCAG_sjabloon.docx...\n');

// Backup original
console.log('📦 Creating backup...');
fs.copyFileSync(TEMPLATE_PATH, BACKUP_PATH);
console.log(`✅ Backup saved to: ${path.basename(BACKUP_PATH)}\n`);

// Read template
const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
const zip = new PizZip(content);

// Get document.xml
let documentXml = zip.file('word/document.xml').asText();

console.log('📖 Current template loaded');
console.log(`📏 Document XML size: ${documentXml.length} characters\n`);

// Extract text content to show user what's in the template
console.log('📄 Extracting text from template...\n');
const textMatches = documentXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
if (textMatches) {
  const texts = textMatches.map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1')).slice(0, 50);
  console.log('First 50 text elements found:');
  texts.forEach((text, i) => {
    console.log(`  ${i + 1}. "${text}"`);
  });
  console.log('');
}

// Common replacements to add placeholders
const replacements = [
  // Dates
  { pattern: /\d{1,2}\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4}/gi, replacement: '{reportDate}' },
  { pattern: /\d{4}-\d{2}-\d{2}/g, replacement: '{reportDate}' },

  // Version numbers
  { pattern: /Versie[\s:]+\d+\.?\d*/gi, replacement: 'Versie {version}' },
  { pattern: /V\d+\.?\d*/g, replacement: 'V{version}' },

  // Organization names (only if they appear to be placeholders)
  { pattern: /Shift2/g, replacement: '{auditedByOrg}' },

  // WCAG references
  { pattern: /WCAG\s+2\.\d+/gi, replacement: '{standard}' },
  { pattern: /niveau\s+(A{1,3}|AA?)/gi, replacement: 'niveau {level}' },
];

console.log('🔧 Applying automatic replacements...\n');

let modified = false;
replacements.forEach(({ pattern, replacement }) => {
  const matches = documentXml.match(pattern);
  if (matches) {
    console.log(`  ✓ Found ${matches.length} match(es) for pattern: ${pattern}`);
    console.log(`    Replacing with: ${replacement}`);
    console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`);
    documentXml = documentXml.replace(pattern, replacement);
    modified = true;
  }
});

console.log('');

if (modified) {
  console.log('✅ Applied automatic replacements\n');
} else {
  console.log('ℹ️  No automatic replacements needed\n');
}

// Save the modified template
console.log('💾 Saving modified template...');

// Make sure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Update the zip with modified document.xml
zip.file('word/document.xml', documentXml);

// Generate new docx
const newContent = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(OUTPUT_PATH, newContent);

console.log(`✅ Modified template saved to: ${OUTPUT_PATH}\n`);

console.log('📋 Summary:');
console.log(`   • Original: WCAG_sjabloon.docx`);
console.log(`   • Backup: ${path.basename(BACKUP_PATH)}`);
console.log(`   • Output: ${OUTPUT_PATH}\n`);

console.log('📝 Next steps:');
console.log('   1. Open the output template in Word');
console.log('   2. Manually add remaining placeholders where needed:');
console.log('      - {projectSubject} - Project naam');
console.log('      - {opdrachtgeverNaam} - Opdrachtgever naam');
console.log('      - {reportIntroHeader} - Intro tekst');
console.log('      - {aboutResearchText} - Over het onderzoek');
console.log('      - {scopeInfo} - Reikwijdte info');
console.log('      - {sampleInfo} - Steekproef info');
console.log('      - {userAgents} - Browsers/tools');
console.log('      - {technologies} - Technologieën');
console.log('      - {conclusionText} - Conclusie');
console.log('      - etc. (see TEMPLATE-GUIDE.md for full list)');
console.log('   3. Ensure the "Samenvatting" heading has bookmark: _Toc_Samenvatting');
console.log('   4. Ensure criteria table has "Voldoet" in header');
console.log('   5. Test by generating a report\n');

console.log('✨ Done!');