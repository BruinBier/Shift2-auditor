import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Read the template with placeholders
const templatePath = path.join(process.cwd(), 'templates', 'formulieren', 'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx');
const content = fs.readFileSync(templatePath, 'binary');

// Load the template
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

// Get all tags/placeholders
try {
  const fullText = doc.getFullText();

  // Extract all placeholders with curly braces
  const placeholderPattern = /\{([^}]+)\}/g;
  const matches = fullText.match(placeholderPattern);

  if (matches) {
    const uniquePlaceholders = [...new Set(matches)];
    console.log('Placeholders found in template:');
    console.log('================================\n');
    uniquePlaceholders.sort().forEach((placeholder, index) => {
      console.log(`${index + 1}. ${placeholder}`);
    });
    console.log(`\nTotal: ${uniquePlaceholders.length} unique placeholders`);
  } else {
    console.log('No placeholders found in format {variableName}');
    console.log('\nShowing first 500 characters of template text:');
    console.log(fullText.substring(0, 500));
  }
} catch (error) {
  console.error('Error reading template:', error);
}