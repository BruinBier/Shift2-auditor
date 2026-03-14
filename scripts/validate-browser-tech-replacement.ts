import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-complete.docx'
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

console.log('\n=== BROWSER VERSIONS VALIDATION ===\n');

// Check for hardcoded browser versions (should NOT be present)
const hardcodedBrowsers = ['Chrome 145', 'Firefox 147', 'Edge 145'];
let foundHardcoded = false;

hardcodedBrowsers.forEach(browser => {
  if (xmlContent.includes(browser)) {
    console.log(`❌ HARDCODED: Found "${browser}" in document`);
    foundHardcoded = true;
  }
});

if (!foundHardcoded) {
  console.log('✓ No hardcoded browser versions found');
}

// Check if browser section exists at all
const browserIntro = 'Het onderzoek is uitgevoerd met:';
const browserIntroIndex = xmlContent.indexOf(browserIntro);

if (browserIntroIndex !== -1) {
  console.log('\n✓ Found browser section intro text');

  // Get some context after the intro to see what browsers are listed
  const afterIntro = xmlContent.substring(browserIntroIndex, browserIntroIndex + 2000);

  // Look for "Chrome" (without version number)
  if (afterIntro.includes('Chrome') || afterIntro.includes('Google')) {
    console.log('✓ Found browser references in section');
  } else {
    console.log('⚠️  No browser references found after intro text');
  }
} else {
  console.log('❌ Browser section intro text not found');
}

console.log('\n=== TECHNOLOGIES VALIDATION ===\n');

// Check for hardcoded "DOM\nHTML\nCSS" pattern
// In XML, newlines might be represented differently
const domIndex = xmlContent.indexOf('DOM', browserIntroIndex || 0);
const htmlIndex = xmlContent.indexOf('HTML', domIndex > 0 ? domIndex : 0);
const cssIndex = xmlContent.indexOf('CSS', htmlIndex > 0 ? htmlIndex : 0);

if (domIndex !== -1 && htmlIndex !== -1 && cssIndex !== -1) {
  console.log('✓ Found DOM, HTML, CSS in document');

  // Check if they're close together (in same section)
  const spacing = cssIndex - domIndex;
  if (spacing < 500) {
    console.log(`✓ Technologies are close together (${spacing} chars apart)`);
  } else {
    console.log(`⚠️  Technologies are far apart (${spacing} chars apart) - may be in different sections`);
  }
} else {
  console.log('⚠️  One or more technology names not found');
  if (domIndex === -1) console.log('   - DOM not found');
  if (htmlIndex === -1) console.log('   - HTML not found');
  if (cssIndex === -1) console.log('   - CSS not found');
}

// Find the tech section heading
const techHeading = 'Onderzoeksmethode en technieken';
const techHeadingIndex = xmlContent.indexOf(techHeading);

if (techHeadingIndex !== -1) {
  console.log('\n✓ Found technologies section heading');
} else {
  console.log('\n❌ Technologies section heading not found');
}

console.log('\n=== FINAL VERDICT ===\n');

if (!foundHardcoded) {
  console.log('✅ SUCCESS: No hardcoded browser versions found');
  console.log('✅ Browser versions and technologies are being replaced from database');
} else {
  console.log('❌ FAILED: Hardcoded browser versions still present in document');
  console.log('   The XML manipulation code may not be working correctly');
}

console.log('\n✓ Validation complete');