import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

/**
 * Add a placeholder URL in the Scope section of the Word template
 * This serves as a template for generating scope URLs dynamically
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

// Find the "Scope" heading (Kop3)
let scopeHeadingStart = -1;
let searchPos = 0;

while ((searchPos = docContent.indexOf('>Scope<', searchPos)) !== -1) {
  // Check if this is THE scope heading (Kop3 style) by looking backwards
  const before = docContent.substring(Math.max(0, searchPos - 300), searchPos);
  if (before.includes('pStyle w:val="Kop3"')) {
    // This is the Scope heading in Onderzoeksdetails!
    const paragraphStart = docContent.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = docContent.lastIndexOf('<w:p>', searchPos);
    scopeHeadingStart = Math.max(paragraphStart, paragraphStart2);
    console.log('[Template] Found "Scope" heading at index', scopeHeadingStart);
    break;
  }
  searchPos++;
}

if (scopeHeadingStart === -1) {
  console.error('Could not find Scope heading in template');
  process.exit(1);
}

// Find the end of the Scope heading paragraph
const scopeHeadingEnd = docContent.indexOf('</w:p>', scopeHeadingStart) + '</w:p>'.length;

// Find the intro text paragraph (the one that starts with "Bij de URL staat...")
const afterScopeHeading = docContent.substring(scopeHeadingEnd);
const introTextEnd = afterScopeHeading.indexOf('</w:p>') + '</w:p>'.length;
const scopeIntroEnd = scopeHeadingEnd + introTextEnd;

console.log('[Template] Found Scope intro text, ends at index', scopeIntroEnd);

// Now we need to add a placeholder URL paragraph after the intro text
// Create a simple hyperlink paragraph with a placeholder URL
const placeholderUrl = 'https://example.com/';

// We need to:
// 1. Add a relationship for the hyperlink
// 2. Add the hyperlink paragraph in the document

// Step 1: Add relationship
const relsFile = zip.file('word/_rels/document.xml.rels');
if (!relsFile) {
  console.error('Could not find word/_rels/document.xml.rels');
  process.exit(1);
}

let relsContent = relsFile.asText();

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

console.log(`[Template] Adding new relationship rId${newRId} for placeholder URL`);

// Add the new relationship before </Relationships>
const newRelationship = `<Relationship Id="rId${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${placeholderUrl}" TargetMode="External"/>`;
relsContent = relsContent.replace('</Relationships>', newRelationship + '</Relationships>');

// Update the relationships file
zip.file('word/_rels/document.xml.rels', relsContent);

// Step 2: Add the hyperlink paragraph in the document
// Create a simple paragraph with a hyperlink
const placeholderParagraph = `
<w:p>
  <w:pPr>
    <w:pStyle w:val="Normal"/>
  </w:pPr>
  <w:hyperlink r:id="rId${newRId}">
    <w:r>
      <w:rPr>
        <w:rStyle w:val="Hyperlink"/>
      </w:rPr>
      <w:t>${placeholderUrl}</w:t>
    </w:r>
  </w:hyperlink>
</w:p>`;

// Insert the placeholder paragraph after the intro text
docContent = docContent.substring(0, scopeIntroEnd) +
            placeholderParagraph +
            docContent.substring(scopeIntroEnd);

// Update the document.xml file
zip.file('word/document.xml', docContent);

console.log('[Template] Added placeholder URL paragraph in Scope section');

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

console.log('\n✓ Done! Added placeholder URL in Scope section.');
console.log('  This placeholder will be replaced with actual project scope URLs during document generation.');