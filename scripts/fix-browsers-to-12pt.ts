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

console.log('Loading template:', templatePath);
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Read numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('numbering.xml not found in template');
  process.exit(1);
}

let numberingContent = numberingXml.asText();

console.log('\n=== Updating abstractNum 2 (Browsers/Testomgeving) font size from 11pt to 12pt ===\n');

// Find abstractNum with abstractNumId="2" (used by numId="4" = browsers)
const abstractNum2Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="2"');
if (abstractNum2Start !== -1) {
  const abstractNum2End = numberingContent.indexOf('</w:abstractNum>', abstractNum2Start) + '</w:abstractNum>'.length;
  let abstractNum2Content = numberingContent.substring(abstractNum2Start, abstractNum2End);

  // Replace all font sizes from 22 to 24 (11pt -> 12pt)
  const originalContent = abstractNum2Content;
  abstractNum2Content = abstractNum2Content.replace(/<w:sz w:val="22"\/>/g, '<w:sz w:val="24"/>');

  if (originalContent !== abstractNum2Content) {
    // Update the full content
    numberingContent = numberingContent.substring(0, abstractNum2Start) + abstractNum2Content + numberingContent.substring(abstractNum2End);
    console.log('✓ Updated abstractNum 2 (browsers) font sizes from 22 (11pt) to 24 (12pt)');
  } else {
    console.log('✗ No changes needed for abstractNum 2 (already 24)');
  }
} else {
  console.error('abstractNum 2 not found');
}

console.log('\n=== Keeping abstractNum 1 (Technologies) at 12pt ===\n');

// Verify abstractNum 1 is at 24 (12pt)
const abstractNum1Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="1"');
if (abstractNum1Start !== -1) {
  const abstractNum1End = numberingContent.indexOf('</w:abstractNum>', abstractNum1Start) + '</w:abstractNum>'.length;
  const abstractNum1Content = numberingContent.substring(abstractNum1Start, abstractNum1End);

  // Check current font size
  const fontSizeMatch = abstractNum1Content.match(/<w:sz w:val="(\d+)"\/>/);
  if (fontSizeMatch) {
    const currentSize = fontSizeMatch[1];
    const currentPt = parseInt(currentSize) / 2;

    if (currentSize === '24') {
      console.log('✓ abstractNum 1 (technologies) already at 24 (12pt) - no change needed');
    } else {
      console.log(`⚠️  abstractNum 1 (technologies) is currently ${currentSize} (${currentPt}pt) - expected 24 (12pt)`);
      console.log('Updating to 24 (12pt)...');

      let updatedAbstractNum1 = abstractNum1Content.replace(/<w:sz w:val="\d+"\/>/g, '<w:sz w:val="24"/>');
      numberingContent = numberingContent.substring(0, abstractNum1Start) + updatedAbstractNum1 + numberingContent.substring(abstractNum1End);
      console.log('✓ Updated abstractNum 1 to 24 (12pt)');
    }
  }
}

// Update the ZIP with modified numbering.xml
zip.file('word/numbering.xml', numberingContent);

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
console.log('\n=== Creating backup ===');
console.log('Backup path:', backupPath);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('✓ Backup created');

// Save the modified template
console.log('\n=== Saving modified template ===');
const modifiedBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, modifiedBuffer);
console.log('✓ Template updated successfully');

console.log('\n=== Verification ===');
// Verify the changes
const verifyZip = new PizZip(fs.readFileSync(templatePath, 'binary'));
const verifyNumberingXml = verifyZip.file('word/numbering.xml');
if (verifyNumberingXml) {
  const verifyContent = verifyNumberingXml.asText();

  // Check abstractNum 2
  const abstractNum2Verify = verifyContent.substring(
    verifyContent.indexOf('<w:abstractNum w:abstractNumId="2"'),
    verifyContent.indexOf('</w:abstractNum>', verifyContent.indexOf('<w:abstractNum w:abstractNumId="2"')) + '</w:abstractNum>'.length
  );

  const fontSizes2 = abstractNum2Verify.match(/<w:sz w:val="(\d+)"\/>/g);
  const uniqueSizes2 = new Set(fontSizes2?.map(m => m.match(/w:val="(\d+)"/)?.[1]));

  console.log('abstractNum 2 (browsers) font sizes:', Array.from(uniqueSizes2).map(s => `${s} (${parseInt(s || '0') / 2}pt)`).join(', '));

  // Check abstractNum 1
  const abstractNum1Verify = verifyContent.substring(
    verifyContent.indexOf('<w:abstractNum w:abstractNumId="1"'),
    verifyContent.indexOf('</w:abstractNum>', verifyContent.indexOf('<w:abstractNum w:abstractNumId="1"')) + '</w:abstractNum>'.length
  );

  const fontSizes1 = abstractNum1Verify.match(/<w:sz w:val="(\d+)"\/>/g);
  const uniqueSizes1 = new Set(fontSizes1?.map(m => m.match(/w:val="(\d+)"/)?.[1]));

  console.log('abstractNum 1 (technologies) font sizes:', Array.from(uniqueSizes1).map(s => `${s} (${parseInt(s || '0') / 2}pt)`).join(', '));
}

console.log('\n✓ All done! Both lists should now be 12pt (24 half-points)');