import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Reading template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found in template');
  process.exit(1);
}

let xmlContent = documentXml.asText();

console.log('Removing Inhopg3 entries from TOC...');

// Find all paragraphs with pStyle="Inhopg3" and remove them
// Pattern: <w:p ...><w:pPr><w:pStyle w:val="Inhopg3"/>...content...</w:p>

let removedCount = 0;
let newXmlContent = xmlContent;

// Use a more robust approach: find each paragraph with Inhopg3 style
const paragraphRegex = /<w:p\s[^>]*>[\s\S]*?<\/w:p>/g;
let match;
const paragraphsToRemove: string[] = [];

// First pass: identify all Inhopg3 paragraphs
const matches = xmlContent.match(paragraphRegex);
if (matches) {
  for (const para of matches) {
    if (para.includes('pStyle w:val="Inhopg3"')) {
      paragraphsToRemove.push(para);
      removedCount++;
    }
  }
}

console.log(`Found ${removedCount} Inhopg3 entries to remove`);

// Second pass: remove them
for (const para of paragraphsToRemove) {
  newXmlContent = newXmlContent.replace(para, '');
}

// Update the ZIP
zip.file('word/document.xml', newXmlContent);

// Create backup of original template
const timestamp = Date.now();
const backupPath = templatePath.replace('.docx', `-BACKUP-${timestamp}.docx`);
fs.writeFileSync(backupPath, content, 'binary');
console.log(`Created backup: ${path.basename(backupPath)}`);

// Save the modified template
const newDocxBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, newDocxBuffer);
console.log(`✅ Updated template: removed ${removedCount} Heading 3 entries from TOC`);
console.log('The TOC now shows only Heading 2 items');