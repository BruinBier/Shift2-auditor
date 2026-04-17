import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function checkReport() {
  const reportPath = path.join(process.cwd(), 'test-report-wierden.docx');

  if (!fs.existsSync(reportPath)) {
    console.error('test-report.docx not found');
    return;
  }

  const content = fs.readFileSync(reportPath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    console.error('document.xml not found');
    return;
  }

  const xml = doc.asText();

  // Search for key patterns
  const patterns = [
    'Dit rapport beschrijft',
    'toegankelijkheid van de content van de formulieren op',
    'Website',
    'wierden.nl',
    'https://www.wierden.nl',
  ];

  console.log('Checking generated report for key text:\n');

  patterns.forEach(pattern => {
    const index = xml.indexOf(pattern);
    if (index !== -1) {
      const start = Math.max(0, index - 150);
      const end = Math.min(xml.length, index + pattern.length + 150);
      console.log(`✓ Found "${pattern}" at index ${index}:`);
      console.log(xml.substring(start, end));
      console.log('\n---\n');
    } else {
      console.log(`✗ "${pattern}" NOT FOUND`);
      console.log('---\n');
    }
  });

  // Check for duplicate intro text
  const introPattern = 'Dit rapport beschrijft de resultaten van het deelonderzoek naar de toegankelijkheid van de content van de formulieren op';
  const matches = xml.split(introPattern).length - 1;
  console.log(`\nIntro text appears ${matches} time(s) in the document.`);
  if (matches === 1) {
    console.log('✓ No duplication detected!');
  } else {
    console.log('✗ Duplication still present!');
  }
}

checkReport().catch(console.error);