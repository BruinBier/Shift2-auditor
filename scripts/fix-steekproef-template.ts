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

// Get document.xml
const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('Could not find word/document.xml');
  process.exit(1);
}

let xmlContent = documentXml.asText();

console.log('Looking for Volledige steekproef section...');

// Find "Volledige steekproef" heading
let steekproefHeadingStart = -1;
let searchPos = 0;

while ((searchPos = xmlContent.indexOf('Volledige steekproef', searchPos)) !== -1) {
  const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);
  if (before.includes('pStyle w:val="Kop')) {
    const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
    steekproefHeadingStart = Math.max(paragraphStart, paragraphStart2);
    console.log('Found "Volledige steekproef" heading at index', steekproefHeadingStart);
    break;
  }
  searchPos++;
}

if (steekproefHeadingStart === -1) {
  console.error('Could not find "Volledige steekproef" heading');
  process.exit(1);
}

// Find the end of the heading paragraph
const steekproefHeadingEnd = xmlContent.indexOf('</w:p>', steekproefHeadingStart) + '</w:p>'.length;

// Find where the section ends (before next Kop3/Kop4 heading)
const afterSteekproefHeading = xmlContent.substring(steekproefHeadingEnd);
const nextHeadingMatch = afterSteekproefHeading.search(/<w:pStyle w:val="Kop[3-4]"/);

if (nextHeadingMatch === -1) {
  console.error('Could not find next heading after Volledige steekproef');
  process.exit(1);
}

const beforeNextHeading = afterSteekproefHeading.substring(0, nextHeadingMatch);
const lastPStart = Math.max(
  beforeNextHeading.lastIndexOf('<w:p '),
  beforeNextHeading.lastIndexOf('<w:p>')
);
const steekproefSectionEnd = steekproefHeadingEnd + lastPStart;

console.log('Section ends at index', steekproefSectionEnd);

// Extract the current content
const currentContent = xmlContent.substring(steekproefHeadingEnd, steekproefSectionEnd);
console.log('\nCurrent section content length:', currentContent.length);

// Check if there are any sample items with title and URL NOT on separate lines
// Look for patterns where title and URL are in same run without line break
const hasSeparateLines = currentContent.includes('<w:br/>');
console.log('Has line breaks between title and URL:', hasSeparateLines);

if (!hasSeparateLines) {
  console.log('\n✅ Template already has correct format (or has no sample items yet)');
  process.exit(0);
}

// Now we need to find and fix sample items
// Look for paragraphs with numbered list (numId="3")
const listItemMatches = currentContent.match(/<w:p[^>]*>[\s\S]*?<w:numPr>[\s\S]*?<w:numId w:val="3"[\s\S]*?<\/w:p>/g);

if (!listItemMatches || listItemMatches.length === 0) {
  console.log('\n✅ No sample items found in template to fix');
  process.exit(0);
}

console.log(`\nFound ${listItemMatches.length} sample item paragraphs to check`);

// For each list item paragraph, check if it has a line break
let needsFixing = false;
let newContent = currentContent;

listItemMatches.forEach((paragraph, index) => {
  // Check if this paragraph has both title text and a line break before URL
  const hasLineBreak = paragraph.includes('<w:br/>');
  const hasText = paragraph.match(/<w:t[^>]*>([^<]+)<\/w:t>/);

  if (hasText && hasLineBreak) {
    console.log(`Item ${index + 1}: Has line break - checking for bold title...`);

    // Check if the first text run (title) has bold formatting
    const firstTextRunMatch = paragraph.match(/<w:r>([\s\S]*?)<w:br\/>/);
    if (firstTextRunMatch) {
      const titleRun = firstTextRunMatch[1];
      const hasBold = titleRun.includes('<w:b/>') || titleRun.includes('<w:b ');

      if (!hasBold) {
        console.log(`  ❌ Title is NOT bold - needs fixing`);
        needsFixing = true;

        // Fix: add bold to the title run
        // Find the pattern: <w:r><w:t>TITLE</w:t></w:r><w:r><w:br/>
        // Replace with: <w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>TITLE</w:t></w:r><w:r><w:br/>

        // Match title run before line break
        const titlePattern = /(<w:r>)(<w:t[^>]*>[^<]+<\/w:t>)(<\/w:r><w:r><w:br\/>)/g;
        const fixed = paragraph.replace(titlePattern, '$1<w:rPr><w:b/><w:bCs/></w:rPr>$2$3');

        newContent = newContent.replace(paragraph, fixed);
      } else {
        console.log(`  ✅ Title is already bold`);
      }
    }
  } else if (hasText && !hasLineBreak) {
    console.log(`Item ${index + 1}: ❌ Missing line break between title and URL - needs restructuring`);
    needsFixing = true;

    // This is more complex - we need to split the title and URL into separate runs with line break
    // For now, just flag it
    console.log('  ⚠️  Manual template edit may be required for this item');
  }
});

if (!needsFixing) {
  console.log('\n✅ All sample items already have correct formatting!');
  process.exit(0);
}

console.log('\n📝 Applying fixes...');

// Replace the section content
const newXmlContent = xmlContent.substring(0, steekproefHeadingEnd) +
  newContent +
  xmlContent.substring(steekproefSectionEnd);

// Update the ZIP
zip.file('word/document.xml', newXmlContent);

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
console.log('\n✨ Done! Titles in "Volledige steekproef" are now bold.');