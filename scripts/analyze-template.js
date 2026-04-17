const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');

// Read the template
const content = fs.readFileSync(
  'templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx',
  'binary'
);

const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

// Get the XML content
const xml = zip.files['word/document.xml'].asText();

// Extract and display the first part of the document (first ~5000 chars)
console.log('=== First 5000 characters of document.xml ===\n');
console.log(xml.substring(0, 5000));

console.log('\n\n=== Searching for "Opdrachtgever" ===\n');
const opdrachtgeverMatches = xml.match(/.{0,200}Opdrachtgever.{0,200}/g);
if (opdrachtgeverMatches) {
  opdrachtgeverMatches.forEach((match, i) => {
    console.log(`\nMatch ${i + 1}:`);
    console.log(match);
  });
}

console.log('\n\n=== Searching for "Datum" ===\n');
const datumMatches = xml.match(/.{0,200}Datum.{0,200}/g);
if (datumMatches) {
  datumMatches.forEach((match, i) => {
    console.log(`\nMatch ${i + 1}:`);
    console.log(match);
  });
}