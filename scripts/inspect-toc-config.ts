import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (documentXml) {
  const xmlContent = documentXml.asText();

  // Find TOC field
  const tocMatch = xmlContent.match(/<w:fldChar[^>]*w:fldCharType="begin"[^>]*>[\s\S]*?TOC[\s\S]*?<w:fldChar[^>]*w:fldCharType="end"[^>]*>/);

  if (tocMatch) {
    console.log('Found TOC field:');
    console.log(tocMatch[0]);
    console.log('\n\nLength:', tocMatch[0].length);

    // Extract just the instruction part
    const instrMatch = tocMatch[0].match(/<w:instrText[^>]*>([^<]+)<\/w:instrText>/g);
    if (instrMatch) {
      console.log('\n\nTOC Instructions:');
      instrMatch.forEach((instr, i) => {
        console.log(`${i + 1}:`, instr);
      });
    }
  } else {
    console.log('TOC field not found');

    // Search for any field instructions
    const allInstructions = xmlContent.match(/<w:instrText[^>]*>([^<]+)<\/w:instrText>/g);
    if (allInstructions) {
      console.log('\nFound field instructions:');
      allInstructions.slice(0, 10).forEach((instr, i) => {
        console.log(`${i + 1}:`, instr);
      });
    }
  }

  // Save a snippet of XML around "Inhoud" for inspection
  const inhoudIndex = xmlContent.indexOf('Inhoud');
  if (inhoudIndex !== -1) {
    const snippet = xmlContent.substring(inhoudIndex - 2000, inhoudIndex + 5000);
    fs.writeFileSync('toc-snippet.xml', snippet, 'utf-8');
    console.log('\n\nSaved TOC snippet to toc-snippet.xml');
  }
} else {
  console.log('document.xml not found in template');
}