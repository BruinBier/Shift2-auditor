/**
 * Script to show text content from Word template
 */
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');

console.log('📖 Reading template text...\n');

const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
const zip = new PizZip(content);
const documentXml = zip.file('word/document.xml').asText();

const textMatches = documentXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
if (textMatches) {
  const texts = textMatches.map(m => m.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1'));

  console.log('First 100 text elements:');
  texts.slice(0, 100).forEach((text, i) => {
    console.log(`${i + 1}. "${text}"`);
  });
}