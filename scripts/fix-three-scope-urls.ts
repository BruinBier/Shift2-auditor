import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Fix 3 scope URLs that all share rId23
 * Create separate rIds for each: rId23, rId26, rId27
 * With placeholders: {scope_url_1}, {scope_url_2}, {scope_url_3}
 */

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'rapport-WCAG_2.2_AA_-_Deelonderzoek_content_formulieren_-_wierden.nl-v1 (1).docx'
);

console.log('Loading template:', templatePath);

// Load the template
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Get the document.xml file
const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('Could not find word/document.xml');
  process.exit(1);
}

let docContent = documentXml.asText();

// Get the relationships file
const relsFile = zip.file('word/_rels/document.xml.rels');
if (!relsFile) {
  console.error('Could not find word/_rels/document.xml.rels');
  process.exit(1);
}

let relsContent = relsFile.asText();

console.log('\n=== FIXING 3 SCOPE URLs ===\n');

// Find all occurrences of rId23 in the document
const rId23Regex = /r:id="rId23"/g;
let matches = [];
let match;

while ((match = rId23Regex.exec(docContent)) !== null) {
  matches.push(match.index);
}

console.log(`Found ${matches.length} hyperlinks using rId23`);

if (matches.length !== 3) {
  console.error(`Expected 3 occurrences, found ${matches.length}`);
  process.exit(1);
}

// Update rId23 relationship to point to {scope_url_1}
console.log('\n1. Updating rId23 → {scope_url_1}');
relsContent = relsContent.replace(
  /<Relationship Id="rId23"[^>]*\/>/,
  '<Relationship Id="rId23" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{scope_url_1}" TargetMode="External"/>'
);
console.log('   ✓ Updated rId23 relationship');

// Create 2 new relationships for rId26 and rId27
console.log('\n2. Creating rId26 → {scope_url_2}');
const newRel26 = '<Relationship Id="rId26" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{scope_url_2}" TargetMode="External"/>';
relsContent = relsContent.replace('</Relationships>', newRel26 + '</Relationships>');
console.log('   ✓ Created rId26 relationship');

console.log('\n3. Creating rId27 → {scope_url_3}');
const newRel27 = '<Relationship Id="rId27" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{scope_url_3}" TargetMode="External"/>';
relsContent = relsContent.replace('</Relationships>', newRel27 + '</Relationships>');
console.log('   ✓ Created rId27 relationship');

// Update the 2nd and 3rd occurrences in the document
// We need to replace from the end to the beginning to keep indices valid
console.log('\n4. Updating document hyperlinks...');

// Replace 3rd occurrence with rId27
const thirdIndex = matches[2];
docContent = docContent.substring(0, thirdIndex) +
             'r:id="rId27"' +
             docContent.substring(thirdIndex + 'r:id="rId23"'.length);
console.log('   ✓ Updated 3rd occurrence to rId27');

// Replace 2nd occurrence with rId26
const secondIndex = matches[1];
docContent = docContent.substring(0, secondIndex) +
             'r:id="rId26"' +
             docContent.substring(secondIndex + 'r:id="rId23"'.length);
console.log('   ✓ Updated 2nd occurrence to rId26');

console.log('   ✓ Kept 1st occurrence as rId23');

// Update the files
zip.file('word/_rels/document.xml.rels', relsContent);
zip.file('word/document.xml', docContent);

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('\n✓ Created backup:', path.basename(backupPath));

// Save the fixed template
const fixedBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, fixedBuffer);
console.log('✓ Fixed template saved:', path.basename(templatePath));

console.log('\n✅ Done! Template now has 3 separate scope URLs:');
console.log('   1. rId23 → {scope_url_1}');
console.log('   2. rId26 → {scope_url_2}');
console.log('   3. rId27 → {scope_url_3}');