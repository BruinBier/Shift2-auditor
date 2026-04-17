import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Fix scope URLs - create 3 separate relationships with unique placeholders
 * Each scope URL needs its own rId and placeholder
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

console.log('\n=== FIXING SCOPE URLs ===\n');

// Find all hyperlinks that use rId23 (the example.com placeholder)
const rId23Regex = /<w:hyperlink[^>]*r:id="rId23"[^>]*>([\s\S]*?)<\/w:hyperlink>/g;
let match;
const rId23Links: string[] = [];

while ((match = rId23Regex.exec(docContent)) !== null) {
  rId23Links.push(match[0]);
}

console.log(`Found ${rId23Links.length} hyperlink(s) using rId23 (https://example.com/)`);

if (rId23Links.length === 0) {
  console.log('✓ No rId23 links found - might already be fixed');
  process.exit(0);
}

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

console.log('\nCreating separate relationships for each scope URL...\n');

// Create a new relationship for each link
rId23Links.forEach((link, index) => {
  maxRId++;
  const newRId = maxRId;
  const scopeNumber = index + 1;
  const placeholderUrl = `{scope_url_${scopeNumber}}`;

  console.log(`${scopeNumber}. Creating rId${newRId} with placeholder: ${placeholderUrl}`);

  // Create new relationship
  const newRelationship = `<Relationship Id="rId${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${placeholderUrl}" TargetMode="External"/>`;
  relsContent = relsContent.replace('</Relationships>', newRelationship + '</Relationships>');

  // Update the hyperlink to use the new rId
  const updatedLink = link.replace('r:id="rId23"', `r:id="rId${newRId}"`);

  // Replace the FIRST occurrence only
  const linkIndex = docContent.indexOf(link);
  if (linkIndex !== -1) {
    docContent = docContent.substring(0, linkIndex) +
                 updatedLink +
                 docContent.substring(linkIndex + link.length);
  }

  console.log(`   ✓ Updated hyperlink to use rId${newRId}`);
});

// Now remove the old rId23 relationship (if it exists)
const rId23Relationship = /<Relationship Id="rId23"[^>]*\/>/;
if (relsContent.match(rId23Relationship)) {
  relsContent = relsContent.replace(rId23Relationship, '');
  console.log('\n✓ Removed old rId23 relationship (https://example.com/)');
}

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

console.log('\n✅ Done! Created separate relationships for each scope URL:');
console.log('   - {scope_url_1}');
console.log('   - {scope_url_2}');
console.log('   - {scope_url_3}');