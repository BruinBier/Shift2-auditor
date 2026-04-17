import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function checkReport() {
  const reportPath = path.join(process.cwd(), 'test-final.docx');

  const content = fs.readFileSync(reportPath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    console.error('document.xml not found');
    return;
  }

  const xml = doc.asText();

  // Find the intro paragraph
  const introIndex = xml.indexOf('Dit rapport beschrijft');
  if (introIndex !== -1) {
    const start = Math.max(0, introIndex - 200);
    const end = Math.min(xml.length, introIndex + 400);
    console.log('INTRO TEXT SECTION:');
    console.log(xml.substring(start, end));
    console.log('\n========\n');
  } else {
    console.log('❌ "Dit rapport beschrijft" NOT FOUND\n');
  }

  // Find Website section
  const websiteIndex = xml.indexOf('Website</w:t>');
  if (websiteIndex !== -1) {
    const start = websiteIndex;
    const end = Math.min(xml.length, websiteIndex + 400);
    console.log('WEBSITE SECTION:');
    console.log(xml.substring(start, end));
    console.log('\n');
  }
}

checkReport().catch(console.error);