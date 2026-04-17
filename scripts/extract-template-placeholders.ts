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

// Extract all {placeholder} patterns (Docxtemplater syntax)
const placeholderRegex = /\{[^{}]+\}/g;
const matches = xmlContent.match(placeholderRegex);

if (matches) {
  const uniquePlaceholders = [...new Set(matches)];
  console.log('\n=== PLACEHOLDERS FOUND IN TEMPLATE ===');
  console.log(`Total unique placeholders: ${uniquePlaceholders.length}\n`);

  // Group by type
  const simpleFields = uniquePlaceholders.filter(p => !p.includes('#') && !p.includes('/'));
  const loopFields = uniquePlaceholders.filter(p => p.includes('#') || p.includes('/'));

  console.log('Simple field placeholders:');
  simpleFields.sort().forEach(placeholder => {
    console.log(`  ${placeholder}`);
  });

  console.log('\nLoop placeholders:');
  loopFields.sort().forEach(placeholder => {
    console.log(`  ${placeholder}`);
  });
} else {
  console.log('No placeholders found');
}

// Also check for any hardcoded content that looks suspicious
console.log('\n=== CHECKING FOR POTENTIAL HARDCODED CONTENT ===\n');

// Check for Valkenswaard references
if (xmlContent.includes('Valkenswaard')) {
  console.log('⚠️  Found "Valkenswaard" in template');
}

// Check for specific URLs
const urlPatterns = [
  'wierden.nl',
  'valkenswaard.nl',
  'https://www',
  'http://www'
];

urlPatterns.forEach(pattern => {
  if (xmlContent.includes(pattern)) {
    console.log(`⚠️  Found "${pattern}" in template`);
  }
});

// Check for specific browser versions
const browserPatterns = [
  'Chrome 145',
  'Firefox 147',
  'Edge 145'
];

browserPatterns.forEach(pattern => {
  if (xmlContent.includes(pattern)) {
    console.log(`⚠️  Found "${pattern}" in template (should be placeholder)`);
  }
});

console.log('\n✓ Template analysis complete');