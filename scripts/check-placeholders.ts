import PizZip from 'pizzip';
import fs from 'fs';

const content = fs.readFileSync('test-google-docs.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== CHECKING PLACEHOLDERS ===');
const placeholders = ['{reportIntroHeader}', '{websiteUrl}', '{opdrachtgeverNaam}'];

placeholders.forEach(p => {
  const count = (xml.match(new RegExp(p.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
  console.log(p + ':', count === 0 ? '✅ Replaced' : '❌ Still present (' + count + 'x)');
});

console.log('\n=== FIRST PAGE INTRO ===');
const introIdx = xml.indexOf('Dit rapport beschrijft');
if (introIdx !== -1) {
  console.log(xml.substring(introIdx, introIdx + 200));
} else {
  console.log('❌ Intro not found');
}

console.log('\n=== WEBSITE FIELD ===');
const websiteIdx = xml.indexOf('Website</w:t>');
if (websiteIdx !== -1) {
  const hyperlinkStart = xml.indexOf('<w:hyperlink', websiteIdx);
  const hyperlinkEnd = xml.indexOf('</w:hyperlink>', hyperlinkStart);
  if (hyperlinkStart !== -1 && hyperlinkEnd !== -1) {
    console.log(xml.substring(hyperlinkStart, hyperlinkEnd + 15));
  }
}