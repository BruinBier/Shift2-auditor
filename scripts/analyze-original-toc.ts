import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Use the original backup before any changes
const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders-BACKUP-1773390272108.docx'
);

console.log('Reading original template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

// Find the Inhoud section
const inhoudIndex = xmlContent.indexOf('Inhoud</w:t>');
if (inhoudIndex === -1) {
  console.error('Could not find Inhoud');
  process.exit(1);
}

// Get a large snippet around the TOC
const snippet = xmlContent.substring(inhoudIndex - 1000, inhoudIndex + 12000);

// Save to file for inspection
fs.writeFileSync('original-toc-structure.xml', snippet, 'utf-8');
console.log('Saved original TOC structure to original-toc-structure.xml');

// Look for field structure
const fldCharMatches = snippet.match(/<w:fldChar[^>]*>/g);
console.log('\nField characters found:', fldCharMatches?.length || 0);

const instrTextMatches = snippet.match(/<w:instrText[^>]*>([^<]*)<\/w:instrText>/g);
console.log('Instruction texts found:', instrTextMatches?.length || 0);
if (instrTextMatches) {
  console.log('Instructions:', instrTextMatches.slice(0, 5));
}

// Count PAGEREF fields
const pageRefCount = (snippet.match(/PAGEREF/g) || []).length;
console.log('\nPAGEREF fields found:', pageRefCount);

// Look for TOC instruction
const tocInstr = snippet.match(/<w:instrText[^>]*>\s*TOC[^<]*<\/w:instrText>/);
if (tocInstr) {
  console.log('\nTOC instruction found:', tocInstr[0]);
} else {
  console.log('\nNo TOC instruction found - this is a manual TOC with hyperlinks only');
}