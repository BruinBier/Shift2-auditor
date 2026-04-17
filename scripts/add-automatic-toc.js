/**
 * Add automatic Word TOC field to the template
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');
const BACKUP_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - BACKUP-BEFORE-AUTO-TOC-' + Date.now() + '.docx');

console.log('📋 Adding automatic TOC field to template...\n');

// Backup
console.log('📦 Creating backup...');
fs.copyFileSync(TEMPLATE_PATH, BACKUP_PATH);
console.log(`✅ Backup: ${path.basename(BACKUP_PATH)}\n`);

// Read template
const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
const zip = new PizZip(content);
let docXml = zip.file('word/document.xml').asText();

console.log('📖 Template loaded\n');

// Create a proper automatic TOC field
// This is the XML structure for a Word TOC that auto-updates
const automaticTocField = `    <w:p>
      <w:pPr>
        <w:pStyle w:val="TOCHeading"/>
      </w:pPr>
      <w:r>
        <w:t>Inhoud</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="TOC1"/>
      </w:pPr>
      <w:r>
        <w:fldChar w:fldCharType="begin"/>
      </w:r>
      <w:r>
        <w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText>
      </w:r>
      <w:r>
        <w:fldChar w:fldCharType="separate"/>
      </w:r>
      <w:hyperlink w:anchor="_Toc_1" w:history="1">
        <w:r>
          <w:rPr>
            <w:rStyle w:val="Hyperlink"/>
          </w:rPr>
          <w:t>Samenvatting</w:t>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
          <w:tab/>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
          <w:fldChar w:fldCharType="begin"/>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
          <w:instrText xml:space="preserve"> PAGEREF _Toc_1 \\h </w:instrText>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
          <w:fldChar w:fldCharType="separate"/>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
          <w:t>1</w:t>
        </w:r>
        <w:r>
          <w:rPr>
            <w:webHidden/>
          </w:rPr>
          <w:fldChar w:fldCharType="end"/>
        </w:r>
      </w:hyperlink>
    </w:p>
    <w:p>
      <w:r>
        <w:fldChar w:fldCharType="end"/>
      </w:r>
    </w:p>`;

console.log('🔍 Looking for insertion point...');

// Find where to insert the TOC - look for "Samenvatting" heading or after title page
let insertionPoint = -1;

// Strategy 1: Look for existing TOC placeholder or "Inhoudsopgave" text
const inhoudsopgaveMatch = docXml.indexOf('Inhoudsopgave</w:t>');
if (inhoudsopgaveMatch !== -1) {
  console.log('✓ Found "Inhoudsopgave" heading');
  // Find the end of this paragraph
  insertionPoint = docXml.indexOf('</w:p>', inhoudsopgaveMatch) + '</w:p>'.length;
  console.log(`  Insertion point: after "Inhoudsopgave" heading\n`);
}

// Strategy 2: Look for "Inhoud" text
if (insertionPoint === -1) {
  const inhoudMatch = docXml.indexOf('Inhoud</w:t>');
  if (inhoudMatch !== -1) {
    console.log('✓ Found "Inhoud" heading');
    insertionPoint = docXml.indexOf('</w:p>', inhoudMatch) + '</w:p>'.length;
    console.log(`  Insertion point: after "Inhoud" heading\n`);
  }
}

// Strategy 3: Insert before "Samenvatting" heading
if (insertionPoint === -1) {
  const samenvattingMatch = docXml.indexOf('Samenvatting</w:t>');
  if (samenvattingMatch !== -1) {
    console.log('✓ Found "Samenvatting" heading');
    // Find the paragraph start
    const paraStart = docXml.lastIndexOf('<w:p', samenvattingMatch);
    insertionPoint = paraStart;
    console.log(`  Insertion point: before "Samenvatting" heading\n`);

    // Also add page break before TOC
    const pageBreakAndTocHeading = `    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>
` + automaticTocField;

    docXml = docXml.substring(0, insertionPoint) + pageBreakAndTocHeading + docXml.substring(insertionPoint);
  }
} else {
  // Insert TOC at found position
  docXml = docXml.substring(0, insertionPoint) + automaticTocField + docXml.substring(insertionPoint);
}

if (insertionPoint === -1) {
  console.error('❌ Could not find suitable insertion point for TOC');
  console.log('💡 Tip: Make sure the template has either "Inhoudsopgave", "Inhoud", or "Samenvatting" heading');
  process.exit(1);
}

console.log('✅ Inserted automatic TOC field\n');

// Save
console.log('💾 Saving template...');
zip.file('word/document.xml', docXml);

const newContent = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(TEMPLATE_PATH, newContent);

console.log(`✅ Saved: ${TEMPLATE_PATH}\n`);

console.log('📋 Summary:');
console.log('   ✓ Added automatic Word TOC field');
console.log('   ✓ TOC will show headings from levels 1-3');
console.log('   ✓ TOC includes hyperlinks to sections');
console.log('   ✓ TOC will auto-update when you update fields\n');

console.log('📝 How to use:');
console.log('   1. Open the template in Word');
console.log('   2. Right-click on the TOC');
console.log('   3. Select "Update Field"');
console.log('   4. Choose "Update entire table"');
console.log('   5. The TOC will automatically populate with all your headings!\n');

console.log('✨ Done!');