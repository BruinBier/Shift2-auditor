import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Check the latest backup
const backupPath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders - BACKUP-20260312-130707.docx';

if (!fs.existsSync(backupPath)) {
  console.log('Backup not found');
  process.exit(1);
}

const content = fs.readFileSync(backupPath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

// Find Bevindingen heading
let searchPos = 0;
while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 200), searchPos);
  if (before.includes('Heading2') || before.includes('Kop2')) {
    console.log('Found Bevindingen heading in backup');

    // Find end of heading paragraph
    const headingEnd = xml.indexOf('</w:p>', searchPos) + 6;

    // Find next Kop3 (first criterion)
    const nextKop3 = xml.indexOf('pStyle w:val="Kop3"', headingEnd);
    const nextKop3Start = xml.lastIndexOf('<w:p', nextKop3);

    // Extract text between
    const between = xml.substring(headingEnd, nextKop3Start);
    const textMatches = between.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

    console.log('\nText between Bevindingen heading and first criterion in BACKUP:');
    if (textMatches && textMatches.some(m => m.replace(/<[^>]+>/g, '').trim())) {
      textMatches.forEach(m => {
        const text = m.replace(/<[^>]+>/g, '');
        if (text.trim()) {
          console.log(`  "${text}"`);
        }
      });
    } else {
      console.log('  (none - only empty paragraphs)');
    }

    break;
  }
  searchPos++;
}