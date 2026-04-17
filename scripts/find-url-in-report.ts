import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function findUrl() {
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

  // Search near the intro text
  const introIndex = xml.indexOf('toegankelijkheid van de content van de formulieren op');
  if (introIndex !== -1) {
    const start = introIndex;
    const end = Math.min(xml.length, introIndex + 500);
    console.log('Context around intro text:');
    console.log(xml.substring(start, end));
    console.log('\n---\n');
  }

  // Search near Website:
  const websiteIndex = xml.indexOf('Website</w:t>');
  if (websiteIndex !== -1) {
    const start = websiteIndex;
    const end = Math.min(xml.length, websiteIndex + 500);
    console.log('Context around Website field:');
    console.log(xml.substring(start, end));
    console.log('\n---\n');
  }

  // Look for hyperlinks
  const hyperlinkPattern = '<w:hyperlink';
  let index = xml.indexOf(hyperlinkPattern);
  let count = 0;
  while (index !== -1 && count < 5) {
    const end = xml.indexOf('</w:hyperlink>', index);
    if (end !== -1) {
      console.log(`Hyperlink ${count + 1}:`);
      console.log(xml.substring(index, end + '</w:hyperlink>'.length));
      console.log('\n---\n');
    }
    index = xml.indexOf(hyperlinkPattern, index + 1);
    count++;
  }
}

findUrl().catch(console.error);