import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Add 2 more scope URL hyperlinks to the template
 * We already have 1 scope URL (rId26), now add 2 more with placeholders
 */

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
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

console.log('\n=== ADDING 2 MORE SCOPE URLs ===\n');

// Find the existing scope URL paragraph (rId26 with {scope_url_1})
const scopeUrlRegex = /<w:p[^>]*>[\s\S]*?<w:hyperlink r:id="rId26"[\s\S]*?{scope_url_1}[\s\S]*?<\/w:p>/;
const existingScopeUrlParagraph = docContent.match(scopeUrlRegex);

if (!existingScopeUrlParagraph) {
  console.error('Could not find existing scope URL paragraph with rId26');
  process.exit(1);
}

console.log('Found existing scope URL paragraph');

// Find the highest rId number
const rIdMatches = relsContent.match(/Id="rId(\d+)"/g);
if (!rIdMatches) {
  console.error('Could not find any rId in relationships');
  process.exit(1);
}

let rIdNumbers = rIdMatches.map(match => {
  const num = match.match(/\d+/);
  return num ? parseInt(num[0]) : 0;
});

let maxRId = Math.max(...rIdNumbers);

// Create 2 new relationships
const newRIds = [maxRId + 1, maxRId + 2];

console.log(`Creating rId${newRIds[0]} for {scope_url_2}`);
console.log(`Creating rId${newRIds[1]} for {scope_url_3}\n`);

// Add the new relationships
for (let i = 0; i < 2; i++) {
  const rId = newRIds[i];
  const scopeNumber = i + 2; // 2 and 3
  const placeholderUrl = `{scope_url_${scopeNumber}}`;

  const newRelationship = `<Relationship Id="rId${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${placeholderUrl}" TargetMode="External"/>`;
  relsContent = relsContent.replace('</Relationships>', newRelationship + '</Relationships>');

  console.log(`✓ Created relationship rId${rId} → ${placeholderUrl}`);
}

// Create 2 new paragraph elements (copy the structure of the existing one)
const baseParagraph = existingScopeUrlParagraph[0];

// Create paragraph 2
const paragraph2 = baseParagraph
  .replace('rId26', `rId${newRIds[0]}`)
  .replace('{scope_url_1}', '{scope_url_2}');

// Create paragraph 3
const paragraph3 = baseParagraph
  .replace('rId26', `rId${newRIds[1]}`)
  .replace('{scope_url_1}', '{scope_url_3}');

// Find where to insert the new paragraphs (after the existing scope URL paragraph)
const insertPosition = docContent.indexOf(existingScopeUrlParagraph[0]) + existingScopeUrlParagraph[0].length;

// Insert the new paragraphs
docContent = docContent.substring(0, insertPosition) +
             paragraph2 +
             paragraph3 +
             docContent.substring(insertPosition);

console.log('\n✓ Added 2 new scope URL paragraphs to document');

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

console.log('\n✅ Done! Template now has 3 scope URLs:');
console.log(`   1. rId26 → {scope_url_1}`);
console.log(`   2. rId${newRIds[0]} → {scope_url_2}`);
console.log(`   3. rId${newRIds[1]} → {scope_url_3}`);