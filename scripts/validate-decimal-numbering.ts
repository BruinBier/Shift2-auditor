import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const docPath = path.join(
  process.cwd(),
  'test-wierden-no-numbering.docx'
);

console.log('Reading generated document...');
const content = fs.readFileSync(docPath, 'binary');
const zip = new PizZip(content);

const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('numbering.xml not found');
  process.exit(1);
}

const xmlContent = numberingXml.asText();

// Check abstractNumId="0" for decimal formatting
console.log('--- Checking numbering format for abstractNumId="0" ---');

const abstractNum0Start = xmlContent.indexOf('<w:abstractNum w:abstractNumId="0"');
if (abstractNum0Start !== -1) {
  const abstractNum0End = xmlContent.indexOf('</w:abstractNum>', abstractNum0Start);
  const abstractNum0Content = xmlContent.substring(abstractNum0Start, abstractNum0End + '</w:abstractNum>'.length);

  // Check for "none" format (no visual numbering)
  if (abstractNum0Content.includes('<w:numFmt w:val="none"/>')) {
    console.log('✓ Found "none" numbering format (no visual markers)');
  } else if (abstractNum0Content.includes('<w:numFmt w:val="decimal"/>')) {
    console.log('✗ Still using decimal format (should be "none")');
  } else if (abstractNum0Content.includes('<w:numFmt w:val="bullet"/>')) {
    console.log('✗ Still using bullet format (should be "none")');
  } else {
    console.log('? Unknown format');
  }

  // Check for empty lvlText (no visual marker)
  if (abstractNum0Content.includes('<w:lvlText w:val=""/>')) {
    console.log('✓ Found empty lvlText (no visual marker)');
  } else {
    console.log('✗ lvlText is not empty');
  }

  // Check if Symbol font is removed
  if (abstractNum0Content.includes('w:ascii="Symbol"')) {
    console.log('✗ Symbol font still present');
  } else {
    console.log('✓ Symbol font removed');
  }

  console.log('\n--- First level content ---');
  const lvl0Match = abstractNum0Content.match(/<w:lvl w:ilvl="0">[\s\S]*?<\/w:lvl>/);
  if (lvl0Match) {
    console.log(lvl0Match[0]);
  }
} else {
  console.log('✗ abstractNumId="0" not found');
}