import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Finding exclusion table ===\n');

// Zoek naar specifieke tekst uit de tabel
const searchTerms = ['3.3.1', 'Foutidentificatie', 'Reden van uitsluiting'];

searchTerms.forEach(term => {
  const pos = xml.indexOf(term);
  console.log(`"${term}": ${pos !== -1 ? 'FOUND at position ' + pos : 'NOT FOUND'}`);
});

// Zoek naar 3.3.1 en toon context
const pos = xml.indexOf('3.3.1');
if (pos !== -1) {
  console.log('\n=== Context around 3.3.1 ===\n');
  const before = xml.substring(Math.max(0, pos - 300), pos);
  const after = xml.substring(pos, Math.min(xml.length, pos + 500));

  console.log('Before:');
  console.log(before.substring(before.length - 200));
  console.log('\nAfter:');
  console.log(after.substring(0, 300));
}