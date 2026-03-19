import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function searchTemplate() {
  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    console.error('document.xml not found');
    return;
  }

  const xml = doc.asText();
  console.log('Searching for patterns...\n');

  const patterns = ['Website', 'formulieren op', 'Dit rapport', 'opdrachtgeverNaam', 'reportIntroHeader', 'toegankelijkheid van'];

  patterns.forEach(pattern => {
    const index = xml.indexOf(pattern);
    if (index !== -1) {
      const start = Math.max(0, index - 100);
      const end = Math.min(xml.length, index + pattern.length + 100);
      console.log(`Found "${pattern}" at index ${index}:`);
      console.log(xml.substring(start, end));
      console.log('\n---\n');
    } else {
      console.log(`"${pattern}" NOT FOUND`);
      console.log('---\n');
    }
  });
}

searchTemplate().catch(console.error);