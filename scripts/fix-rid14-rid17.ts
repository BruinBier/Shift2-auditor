import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Fix rId14 and rId17 broken links:
 * - rId14: Remove old HHNK URL hyperlink completely
 * - rId17: Create new relationship for {websiteUrl} placeholder
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

console.log('\n=== FIXING BROKEN LINKS ===\n');

// 1. Remove rId14 (old HHNK URL) completely
console.log('1. Removing rId14 (https://mijn.hhnk.nl/authenticate)...');

const rId14Hyperlink = '<w:hyperlink r:id="rId14" w:tgtFrame="_blank" w:tooltip="opent in nieuw venster" w:history="1"><w:r w:rsidRPr="00D1606E"><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>https://mijn.hhnk.nl/authenticate</w:t></w:r></w:hyperlink>';

if (docContent.includes(rId14Hyperlink)) {
  docContent = docContent.replace(rId14Hyperlink, '');
  console.log('   ✓ Removed rId14 hyperlink from document');
} else {
  console.log('   ⚠️  rId14 hyperlink not found (might already be removed)');
}

// 2. Fix rId17 ({websiteUrl} placeholder)
console.log('\n2. Fixing rId17 ({websiteUrl} placeholder)...');

const rId17Hyperlink = '<w:hyperlink r:id="rId17" w:tgtFrame="_blank" w:tooltip="open in nieuw venster" w:history="1"><w:r w:rsidRPr="00076DF6"><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>{websiteUrl}</w:t></w:r></w:hyperlink>';

if (docContent.includes(rId17Hyperlink)) {
  // Find the highest rId number
  const rIdMatches = relsContent.match(/Id="rId(\d+)"/g);
  if (!rIdMatches) {
    console.error('Could not find any rId in relationships');
    process.exit(1);
  }

  const rIdNumbers = rIdMatches.map(match => {
    const num = match.match(/\d+/);
    return num ? parseInt(num[0]) : 0;
  });

  const maxRId = Math.max(...rIdNumbers);
  const newRId = maxRId + 1;

  console.log(`   Creating new relationship rId${newRId} for {websiteUrl} placeholder`);

  // Create a new relationship with a placeholder URL
  const placeholderUrl = '{website_url}';
  const newRelationship = `<Relationship Id="rId${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${placeholderUrl}" TargetMode="External"/>`;
  relsContent = relsContent.replace('</Relationships>', newRelationship + '</Relationships>');

  // Update the hyperlink to use the new rId
  const updatedHyperlink = rId17Hyperlink.replace('r:id="rId17"', `r:id="rId${newRId}"`);
  docContent = docContent.replace(rId17Hyperlink, updatedHyperlink);

  console.log(`   ✓ Updated hyperlink to use rId${newRId}`);
  console.log(`   ✓ Created relationship with placeholder: ${placeholderUrl}`);
} else {
  console.log('   ⚠️  rId17 hyperlink not found (might already be fixed)');
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

console.log('\n✅ Done!');
console.log('   - Removed old HHNK URL (rId14)');
console.log('   - Fixed {websiteUrl} placeholder link (rId17)');