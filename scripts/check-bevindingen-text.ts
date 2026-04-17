import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const documentXml = zip.file('word/document.xml');
if (documentXml) {
  const xmlContent = documentXml.asText();

  // Find "Bevindingen" heading (Heading2 or Kop2)
  let searchPos = 0;
  while ((searchPos = xmlContent.indexOf('Bevindingen', searchPos)) !== -1) {
    const before = xmlContent.substring(Math.max(0, searchPos - 300), searchPos);
    const after = xmlContent.substring(searchPos, searchPos + 2000);

    if (before.includes('pStyle w:val="Heading2"') || before.includes('pStyle w:val="Kop2"')) {
      console.log('=== Found Bevindingen Heading2 ===');
      console.log('\nBefore (last 300 chars):');
      console.log(before.substring(before.length - 300));
      console.log('\n=== The heading ===');
      console.log(after.substring(0, 300));

      // Find the next few paragraphs after this heading
      console.log('\n=== Next content after heading ===');
      const headingEnd = after.indexOf('</w:p>') + '</w:p>'.length;
      const nextContent = after.substring(headingEnd, headingEnd + 1500);

      // Extract all text from the next content
      const textMatches = nextContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches) {
        console.log('\nText elements found after Bevindingen heading:');
        textMatches.slice(0, 10).forEach((match, i) => {
          const text = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
          console.log(`${i + 1}. "${text}"`);
        });
      }

      break;
    }
    searchPos++;
  }
}