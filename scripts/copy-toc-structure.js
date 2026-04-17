/**
 * Copy TOC structure from rapport-ijsselstein-toegankelijk.docx to the current template
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../rapport-ijsselstein-toegankelijk.docx');
const TARGET_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');
const BACKUP_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - BACKUP-BEFORE-TOC-' + Date.now() + '.docx');

console.log('📋 Copying TOC structure...\n');

// Check if files exist
if (!fs.existsSync(SOURCE_PATH)) {
  console.error('❌ Source file not found:', SOURCE_PATH);
  process.exit(1);
}

if (!fs.existsSync(TARGET_PATH)) {
  console.error('❌ Target file not found:', TARGET_PATH);
  process.exit(1);
}

// Backup target
console.log('📦 Creating backup of target template...');
fs.copyFileSync(TARGET_PATH, BACKUP_PATH);
console.log(`✅ Backup saved: ${path.basename(BACKUP_PATH)}\n`);

// Read both files
console.log('📖 Reading source file (rapport-ijsselstein-toegankelijk.docx)...');
const sourceContent = fs.readFileSync(SOURCE_PATH, 'binary');
const sourceZip = new PizZip(sourceContent);
const sourceDocXml = sourceZip.file('word/document.xml').asText();

console.log('📖 Reading target file (current template)...');
const targetContent = fs.readFileSync(TARGET_PATH, 'binary');
const targetZip = new PizZip(targetContent);
let targetDocXml = targetZip.file('word/document.xml').asText();

console.log('✅ Both files loaded\n');

// Extract TOC field from source
console.log('🔍 Extracting TOC field from source...');

// Look for TOC field - it's usually between fldChar begin and fldChar end
const tocRegex = /<w:p[^>]*>[\s\S]*?<w:fldChar w:fldCharType="begin"[^>]*\/>[\s\S]*?<w:instrText[^>]*>[\s\S]*?TOC[\s\S]*?<\/w:instrText>[\s\S]*?<w:fldChar w:fldCharType="end"[^>]*\/>[\s\S]*?<\/w:p>/;
const tocMatch = sourceDocXml.match(tocRegex);

if (!tocMatch) {
  console.error('❌ Could not find TOC field in source document');
  console.log('\n💡 Tip: Make sure the source document has a proper Table of Contents field');
  process.exit(1);
}

const tocField = tocMatch[0];
console.log('✅ Found TOC field in source');
console.log(`📏 TOC field size: ${tocField.length} characters\n`);

// Find TOC in target document
console.log('🔍 Looking for TOC in target document...');
const targetTocMatch = targetDocXml.match(tocRegex);

if (!targetTocMatch) {
  console.log('⚠️  No existing TOC found in target');
  console.log('📝 Looking for "Inhoudsopgave" heading to insert TOC after...\n');

  // Find Inhoudsopgave heading
  const inhoudsopgaveIndex = targetDocXml.indexOf('Inhoudsopgave</w:t>');

  if (inhoudsopgaveIndex === -1) {
    console.error('❌ Could not find "Inhoudsopgave" heading in target document');
    process.exit(1);
  }

  // Find the end of the paragraph containing "Inhoudsopgave"
  const paragraphEnd = targetDocXml.indexOf('</w:p>', inhoudsopgaveIndex);

  if (paragraphEnd === -1) {
    console.error('❌ Could not find paragraph end after "Inhoudsopgave"');
    process.exit(1);
  }

  // Insert TOC field after the Inhoudsopgave heading
  const insertPosition = paragraphEnd + '</w:p>'.length;
  targetDocXml = targetDocXml.substring(0, insertPosition) + '\n' + tocField + '\n' + targetDocXml.substring(insertPosition);

  console.log('✅ Inserted TOC field after "Inhoudsopgave" heading');
} else {
  console.log('✅ Found existing TOC in target');
  console.log('🔄 Replacing with source TOC...');

  // Replace existing TOC with source TOC
  targetDocXml = targetDocXml.replace(targetTocMatch[0], tocField);

  console.log('✅ Replaced TOC field');
}

console.log('');

// Save the modified target
console.log('💾 Saving modified template...');
targetZip.file('word/document.xml', targetDocXml);

const newContent = targetZip.generate({ type: 'nodebuffer' });
fs.writeFileSync(TARGET_PATH, newContent);

console.log(`✅ Saved: ${TARGET_PATH}\n`);

console.log('📋 Summary:');
console.log('   ✓ Copied TOC structure from rapport-ijsselstein-toegankelijk.docx');
console.log('   ✓ Updated template with proper TOC field');
console.log('   ✓ Backup created\n');

console.log('📝 Next steps:');
console.log('   1. Open the template in Word');
console.log('   2. Right-click on the TOC and select "Update Field"');
console.log('   3. Choose "Update entire table"');
console.log('   4. Verify that the TOC looks correct');
console.log('   5. Save the template');
console.log('   6. Test by generating a report\n');

console.log('✨ Done!');