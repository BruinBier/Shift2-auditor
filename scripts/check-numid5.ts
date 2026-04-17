import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Load the template
const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('numbering.xml not found');
  process.exit(1);
}

const numberingContent = numberingXml.asText();

console.log('\n=== Checking numId="5" (Technologieën list) ===\n');

// Find num with numId="5"
const numPattern = /<w:num w:numId="5"[^>]*>[\s\S]*?<\/w:num>/;
const numMatch = numberingContent.match(numPattern);

if (numMatch) {
  console.log('Found num definition:');
  console.log(numMatch[0]);

  // Extract abstractNumId
  const abstractNumIdMatch = numMatch[0].match(/<w:abstractNumId w:val="(\d+)"\/>/);
  if (abstractNumIdMatch) {
    const abstractNumId = abstractNumIdMatch[1];
    console.log(`\n--- Linked to abstractNumId="${abstractNumId}" ---`);

    // Find the abstractNum
    const abstractNumPattern = new RegExp(`<w:abstractNum w:abstractNumId="${abstractNumId}"[^>]*>[\\s\\S]*?<\\/w:abstractNum>`);
    const abstractNumMatch = numberingContent.match(abstractNumPattern);

    if (abstractNumMatch) {
      console.log('\nFound abstractNum definition (first 2000 chars):');
      console.log(abstractNumMatch[0].substring(0, 2000));

      // Extract font sizes from abstractNum
      const abstractFontSizes = abstractNumMatch[0].match(/<w:sz w:val="(\d+)"\/>/g);
      if (abstractFontSizes) {
        console.log('\n--- Font sizes in abstractNum ---');
        const uniqueSizes = new Set(abstractFontSizes);
        uniqueSizes.forEach(match => {
          const size = match.match(/w:val="(\d+)"/)?.[1];
          const pt = size ? parseInt(size) / 2 : 0;
          const count = abstractFontSizes.filter(m => m === match).length;
          console.log(`  ${match} -> ${pt}pt (${count} occurrences)`);
        });

        // Check if any are NOT 22
        const hasDifferentSizes = Array.from(uniqueSizes).some(s => {
          const val = s.match(/w:val="(\d+)"/)?.[1];
          return val !== '22';
        });

        if (hasDifferentSizes) {
          console.log('\n⚠️  PROBLEM: Technologieën list has different font size than browsers list!');
        } else {
          console.log('\n✓ Technologieën list has same font size (11pt) as browsers list');
        }
      }
    }
  }
} else {
  console.log('numId="5" not found');
}

// Also show all num definitions
console.log('\n\n=== All num definitions ===\n');
const allNumsPattern = /<w:num w:numId="\d+"[^>]*>[\s\S]*?<\/w:num>/g;
const allNums = numberingContent.match(allNumsPattern);
if (allNums) {
  allNums.forEach(num => {
    const numId = num.match(/w:numId="(\d+)"/)?.[1];
    const abstractNumId = num.match(/<w:abstractNumId w:val="(\d+)"\/>/)?.[1];
    console.log(`numId="${numId}" → abstractNumId="${abstractNumId}"`);
  });
}