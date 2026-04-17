import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Check if test-output.docx exists
const outputPath = path.join(process.cwd(), 'test-output.docx');

if (!fs.existsSync(outputPath)) {
  console.log('test-output.docx not found. Please generate a report first.');
  process.exit(1);
}

const content = fs.readFileSync(outputPath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (documentXml) {
  const xmlContent = documentXml.asText();

  // Find "Bevindingen" heading (Heading2 or Kop2)
  let searchPos = 0;
  while ((searchPos = xmlContent.indexOf('Bevindingen', searchPos)) !== -1) {
    const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);

    if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
      console.log('=== Found Bevindingen Heading2 in generated report ===\n');

      // Find the end of this paragraph
      const headingStart = xmlContent.lastIndexOf('<w:p', searchPos);
      const headingEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;

      // Get next 2000 chars after the heading
      const after = xmlContent.substring(headingEnd, headingEnd + 2000);

      // Extract all text from the next content
      const textMatches = after.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches) {
        console.log('Text elements found after Bevindingen heading:');
        textMatches.slice(0, 15).forEach((match, i) => {
          const text = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
          console.log(`${i + 1}. "${text}"`);
        });
      }

      break;
    }
    searchPos++;
  }
} else {
  console.log('Could not find document.xml in test-output.docx');
}