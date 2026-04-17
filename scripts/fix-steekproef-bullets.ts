import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

// Read the template
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Get numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('Could not find word/numbering.xml');
  process.exit(1);
}

let numberingContent = numberingXml.asText();

console.log('Looking for abstractNum with abstractNumId="0" (used by numId="3" - sample items)...');

// Find abstractNum with abstractNumId="0" (used by numId="3" - sample items)
const abstractNum0Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="0"');
if (abstractNum0Start === -1) {
  console.error('Could not find abstractNum 0');
  process.exit(1);
}

const abstractNum0End = numberingContent.indexOf('</w:abstractNum>', abstractNum0Start);
const abstractNum0Content = numberingContent.substring(abstractNum0Start, abstractNum0End);

console.log('Found abstractNum 0');

// Find the first lvl (ilvl="0") within this abstractNum
const lvl0Start = abstractNum0Content.indexOf('<w:lvl w:ilvl="0">');
if (lvl0Start === -1) {
  console.error('Could not find lvl 0 in abstractNum 0');
  process.exit(1);
}

const lvl0End = abstractNum0Content.indexOf('</w:lvl>', lvl0Start) + '</w:lvl>'.length;
let lvl0Content = abstractNum0Content.substring(lvl0Start, lvl0End);

console.log('\nCurrent lvl 0 configuration:');
console.log('- Has numFmt:', lvl0Content.includes('<w:numFmt'));
console.log('- Has lvlText:', lvl0Content.includes('<w:lvlText'));
console.log('- Has indentation:', lvl0Content.includes('<w:ind'));

// Check current format
const currentFormat = lvl0Content.match(/<w:numFmt w:val="([^"]+)"/);
const currentLvlText = lvl0Content.match(/<w:lvlText w:val="([^"]*)"/);

console.log('- Current format:', currentFormat ? currentFormat[1] : 'not found');
console.log('- Current lvlText:', currentLvlText ? `"${currentLvlText[1]}"` : 'not found');

// Check if it's set to "none" (hidden bullets)
const isHidden = currentFormat && currentFormat[1] === 'none';

if (!isHidden) {
  console.log('\n✅ Bullets are already visible (not set to "none")');

  // Check if it's bullet format AND has bullet character
  if (currentFormat && currentFormat[1] === 'bullet' && currentLvlText && currentLvlText[1] !== '') {
    console.log('✅ Already using bullet format with bullet character');
    process.exit(0);
  }

  // If bullet format but no character, continue to fix it
  if (currentFormat && currentFormat[1] === 'bullet' && (!currentLvlText || currentLvlText[1] === '')) {
    console.log('⚠️  Bullet format but missing bullet character - will fix');
  }
}

console.log('\n📝 Configuring bullets for sample items...');

// Replace format with "bullet" to show bullets
lvl0Content = lvl0Content.replace(/<w:numFmt w:val="[^"]+"\/>/, '<w:numFmt w:val="bullet"/>');

// Set lvlText to bullet character (· = U+00B7 middle dot, used by Symbol font)
// Character code in Symbol font for bullet is
lvl0Content = lvl0Content.replace(/<w:lvlText w:val="[^"]*"\/>/, '<w:lvlText w:val="·"/>');

// Set proper indentation (720 = 0.5 inch left, 360 = 0.25 inch hanging)
if (lvl0Content.includes('<w:ind')) {
  lvl0Content = lvl0Content.replace(/<w:ind[^>]*\/>/, '<w:ind w:left="720" w:hanging="360"/>');
} else {
  // Add indentation if not present - insert before </w:lvl>
  lvl0Content = lvl0Content.replace('</w:lvl>', '<w:ind w:left="720" w:hanging="360"/></w:lvl>');
}

// Make sure we have the Symbol font for bullets
if (!lvl0Content.includes('w:ascii="Symbol"')) {
  // Add rPr with Symbol font if not present
  if (lvl0Content.includes('<w:rPr>')) {
    // Add to existing rPr
    lvl0Content = lvl0Content.replace('<w:rPr>', '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/>');
  } else {
    // Create new rPr section before </w:lvl>
    lvl0Content = lvl0Content.replace('</w:lvl>', '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>');
  }
}

console.log('\nNew configuration:');
console.log('- Format: bullet');
console.log('- Symbol font: Symbol');
console.log('- Indentation: 720 left, 360 hanging');

// Update the abstractNum content
const updatedAbstractNum0 = abstractNum0Content.substring(0, lvl0Start) + lvl0Content + abstractNum0Content.substring(lvl0End);

// Update the full numbering content
const newNumberingContent = numberingContent.substring(0, abstractNum0Start) + updatedAbstractNum0 + numberingContent.substring(abstractNum0End);

// Update the ZIP
zip.file('word/numbering.xml', newNumberingContent);

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('\n💾 Created backup:', path.basename(backupPath));

// Save the modified template
const output = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, output);
console.log('✅ Updated template:', path.basename(templatePath));
console.log('\n✨ Done! Bullets are now visible for sample items in "Volledige steekproef".');