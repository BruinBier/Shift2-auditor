import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Read the original template (without placeholders)
const templatePath = path.join(process.cwd(), 'templates', 'formulieren', 'Toegankelijkheidsonderzoek formulieren Template.docx');
const content = fs.readFileSync(templatePath, 'binary');

// Load the template
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

// Get all text
try {
  const fullText = doc.getFullText();
  console.log('=== FULL TEMPLATE TEXT ===\n');
  console.log(fullText);
  console.log('\n=== END OF TEXT ===');
} catch (error) {
  console.error('Error reading template:', error);
}