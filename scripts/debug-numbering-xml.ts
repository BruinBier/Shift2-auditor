import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

const zip = new AdmZip(templatePath);
const numberingEntry = zip.getEntry('word/numbering.xml');

if (!numberingEntry) {
  console.error('Could not find word/numbering.xml');
  process.exit(1);
}

const numberingXml = numberingEntry.getData().toString('utf8');

// Search for all lvlText elements
const lvlTextMatches = numberingXml.match(/<w:lvlText[^>]*>/g);

console.log('\nAll lvlText elements found:');
if (lvlTextMatches) {
  lvlTextMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match}`);
  });
} else {
  console.log('No lvlText elements found!');
}

// Check specific patterns
console.log('\n=== Pattern Checks ===');
console.log('Pattern: <w:lvlText w:val=""   />  (with spaces):', (numberingXml.match(/<w:lvlText w:val=""\s*\/>/g) || []).length);
console.log('Pattern: <w:lvlText w:val=""/>      (no space):', (numberingXml.match(/<w:lvlText w:val=""\/>/g) || []).length);
console.log('Pattern: <w:lvlText w:val="·"/>     (with bullet):', (numberingXml.match(/<w:lvlText w:val="·"\/>/g) || []).length);

// Extract a sample and check character codes
const emptyLvlText = numberingXml.match(/<w:lvlText w:val="[^"]*"\/>/g);
if (emptyLvlText && emptyLvlText[2]) {
  const thirdMatch = emptyLvlText[2]; // Should be an "empty" one
  console.log('\n=== Third lvlText element (supposedly empty) ===');
  console.log('String:', thirdMatch);
  console.log('Length:', thirdMatch.length);

  // Extract the value between quotes
  const valueMatch = thirdMatch.match(/w:val="([^"]*)"/);
  if (valueMatch) {
    const value = valueMatch[1];
    console.log('Value length:', value.length);
    console.log('Value char codes:', Array.from(value).map((c, i) => `${i}: ${c.charCodeAt(0)} (${c})`).join(', '));
  }
}