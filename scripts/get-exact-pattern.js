const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const templatePath = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');

// Open the docx file as a zip
const zip = new AdmZip(templatePath);

// Read document.xml
let documentXml = zip.readAsText('word/document.xml');

// Find "Onderzoeksmethode en technieken"
const methodIndex = documentXml.indexOf('Onderzoeksmethode en technieken');
console.log('Section found at:', methodIndex);

// Find WCAG-EM after this section
const wcagIndex = documentXml.indexOf('WCAG-EM', methodIndex);
console.log('WCAG-EM found at:', wcagIndex, '(distance:', wcagIndex - methodIndex, ')');

// Get 1000 characters around this WCAG-EM
const contextStart = wcagIndex - 500;
const contextEnd = wcagIndex + 500;
const context = documentXml.substring(contextStart, contextEnd);

console.log('\n=== EXACT XML PATTERN ===');
console.log(context);
console.log('=== END ===\n');

// Also save to file for easier inspection
fs.writeFileSync(path.join(__dirname, 'wcagem-context.xml'), context, 'utf-8');
console.log('✓ Saved context to wcagem-context.xml');