import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Full TOC Structure in Template ===\n');

// Find the TOC SDT block
const sdtStart = xml.indexOf('<w:sdt>');
const sdtEnd = xml.indexOf('</w:sdt>', sdtStart) + '</w:sdt>'.length;
const tocBlock = xml.substring(sdtStart, sdtEnd);

// Find all paragraphs in TOC
const paragraphs = tocBlock.match(/<w:p[^>]*>.*?<\/w:p>/gs);

if (!paragraphs) {
  console.log('ERROR: No paragraphs found');
  process.exit(1);
}

console.log(`Found ${paragraphs.length} paragraphs in TOC\n`);

paragraphs.forEach((p, i) => {
  const hasKop2 = p.includes('pStyle w:val="Kop2"');
  const hasInhopg = p.match(/pStyle w:val="Inhopg/);
  const hasPageRef = p.includes('PAGEREF');
  const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
  const text = textMatches ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ') : '(no text)';

  let description = '';
  if (hasKop2) description = '[Kop2 HEADING]';
  else if (hasInhopg) description = `[${hasInhopg[0].match(/Inhopg\d?/)?.[0] || 'Inhopg'} entry]`;
  else description = '[Other]';

  console.log(`${i + 1}. ${description} ${hasPageRef ? '📄 PAGEREF' : ''}`);
  console.log(`   Text: ${text.substring(0, 80)}`);
  console.log('');
});