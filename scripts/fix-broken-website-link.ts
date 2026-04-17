import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Fix broken website link (rId10) in Word template
 * The relationship was deleted but the hyperlink reference still exists
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

console.log('\n=== CHECKING FOR BROKEN LINKS ===');

// Find all hyperlink references in document
const hyperlinkMatches = docContent.match(/<w:hyperlink[^>]*r:id="([^"]+)"[^>]*>/g);
if (hyperlinkMatches) {
  console.log('\nFound hyperlinks in document:');
  hyperlinkMatches.forEach((match, index) => {
    const rIdMatch = match.match(/r:id="([^"]+)"/);
    if (rIdMatch) {
      const rId = rIdMatch[1];
      console.log(`  ${index + 1}. ${rId}`);

      // Check if this rId exists in relationships
      if (!relsContent.includes(`Id="${rId}"`)) {
        console.log(`     ⚠️  BROKEN: ${rId} not found in relationships!`);
      }
    }
  });
}

// Find the broken rId10 hyperlink
const rId10Match = docContent.match(/<w:hyperlink[^>]*r:id="rId10"[^>]*>[\s\S]*?<\/w:hyperlink>/);

if (rId10Match) {
  console.log('\n=== FOUND BROKEN rId10 HYPERLINK ===');
  console.log('Hyperlink content:', rId10Match[0].substring(0, 200) + '...');

  // Extract the text from the hyperlink
  const textMatch = rId10Match[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/);
  let linkText = 'Website URL';
  if (textMatch) {
    linkText = textMatch[1];
    console.log('Link text:', linkText);
  }

  // Create a new relationship with a placeholder URL
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

  console.log(`\nCreating new relationship rId${newRId} with placeholder URL`);

  // Add the new relationship
  const placeholderUrl = '{website_url}';
  const newRelationship = `<Relationship Id="rId${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${placeholderUrl}" TargetMode="External"/>`;
  relsContent = relsContent.replace('</Relationships>', newRelationship + '</Relationships>');

  // Update the hyperlink to use the new rId
  const updatedHyperlink = rId10Match[0].replace('r:id="rId10"', `r:id="rId${newRId}"`);
  docContent = docContent.replace(rId10Match[0], updatedHyperlink);

  console.log(`✓ Updated hyperlink to use rId${newRId}`);

  // Update the files
  zip.file('word/_rels/document.xml.rels', relsContent);
  zip.file('word/document.xml', docContent);

  console.log('✓ Updated template files');
} else {
  console.log('\n✓ No broken rId10 hyperlink found');
}

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

console.log('\n✅ Done! Fixed broken website link in Word template.');
console.log('   The link now points to placeholder: {website_url}');