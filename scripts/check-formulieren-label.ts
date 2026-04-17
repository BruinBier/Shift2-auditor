import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Load the template
const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Search for "Formulieren:" text
const searchTerms = ['Formulieren:', 'websiteUrl', 'opdrachtgeverNaam', 'reportDate', 'version'];

searchTerms.forEach(term => {
  const index = xmlContent.indexOf(term);
  if (index !== -1) {
    console.log(`\n=== Found: "${term}" ===`);
    console.log('Index:', index);

    // Show context (300 chars before and after)
    const contextStart = Math.max(0, index - 300);
    const contextEnd = Math.min(xmlContent.length, index + 300);
    const context = xmlContent.substring(contextStart, contextEnd);

    console.log('Context:');
    console.log(context);
  } else {
    console.log(`\n"${term}" not found in document.xml`);
  }
});

// Also check first page content
console.log('\n\n=== Searching for page 1 content pattern ===');
const page1Patterns = ['Opdrachtgever', 'Raportversie', 'Datum'];

page1Patterns.forEach(pattern => {
  const index = xmlContent.indexOf(pattern);
  if (index !== -1) {
    console.log(`\nFound "${pattern}" at index ${index}`);
    const contextStart = Math.max(0, index - 200);
    const contextEnd = Math.min(xmlContent.length, index + 400);
    console.log(xmlContent.substring(contextStart, contextEnd));
  }
});