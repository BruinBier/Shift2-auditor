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

console.log('\n=== SEARCHING FOR BROWSER/TECH SECTION ===\n');

// Find the test environment section
const browserIndex = xmlContent.indexOf('Chrome 145');
if (browserIndex !== -1) {
  console.log('Found "Chrome 145" at position:', browserIndex);

  // Get 500 chars before and after to see context
  const before = xmlContent.substring(browserIndex - 500, browserIndex);
  const after = xmlContent.substring(browserIndex, browserIndex + 1000);

  console.log('\n--- CONTEXT BEFORE ---');
  console.log(before);

  console.log('\n--- BROWSER SECTION (with Chrome 145) ---');
  console.log(after);

  // Check if there's a placeholder nearby
  const surroundingText = xmlContent.substring(browserIndex - 1000, browserIndex + 1000);
  const placeholders = surroundingText.match(/\{[^{}]+\}/g);

  if (placeholders) {
    console.log('\n--- PLACEHOLDERS FOUND NEAR BROWSER VERSIONS ---');
    placeholders.forEach(p => console.log(`  ${p}`));
  } else {
    console.log('\n⚠️  NO PLACEHOLDERS FOUND NEAR BROWSER VERSIONS');
    console.log('This means browser versions are HARDCODED in template');
    console.log('They are NOT being replaced by Docxtemplater');
  }
}

// Find DOM/HTML/CSS section
const domIndex = xmlContent.indexOf('DOM');
const htmlIndex = xmlContent.indexOf('HTML');
const cssIndex = xmlContent.indexOf('CSS');

console.log('\n\n=== SEARCHING FOR TECHNOLOGIES SECTION ===\n');

if (domIndex !== -1 && htmlIndex !== -1 && cssIndex !== -1) {
  // Check if they're close together (in same section)
  if (Math.abs(domIndex - htmlIndex) < 200 && Math.abs(htmlIndex - cssIndex) < 200) {
    console.log('Found DOM, HTML, CSS in close proximity');
    console.log('Positions:', { domIndex, htmlIndex, cssIndex });

    const minIndex = Math.min(domIndex, htmlIndex, cssIndex);
    const maxIndex = Math.max(domIndex, htmlIndex, cssIndex);

    // Get surrounding context
    const techSection = xmlContent.substring(minIndex - 500, maxIndex + 500);

    console.log('\n--- TECHNOLOGIES SECTION ---');
    console.log(techSection.substring(0, 1000));

    // Check for placeholders
    const placeholders = techSection.match(/\{[^{}]+\}/g);

    if (placeholders) {
      console.log('\n--- PLACEHOLDERS FOUND NEAR TECHNOLOGIES ---');
      placeholders.forEach(p => console.log(`  ${p}`));
    } else {
      console.log('\n⚠️  NO PLACEHOLDERS FOUND NEAR TECHNOLOGIES');
      console.log('This means technologies (DOM/HTML/CSS) are HARDCODED in template');
      console.log('They are NOT being replaced by Docxtemplater');
    }
  }
}

console.log('\n\n=== CONCLUSION ===\n');
console.log('If NO placeholders were found near browser versions or technologies,');
console.log('then these values are HARDCODED in the template and NOT replaced by route.ts.');
console.log('\nThe templateData fields (userAgents, technologies) exist in route.ts,');
console.log('but they may not have corresponding {placeholders} in the template.');
console.log('\nNEXT STEP: Add placeholders to template OR use XML manipulation to replace them.');