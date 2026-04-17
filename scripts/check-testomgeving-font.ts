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

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

console.log('\n=== Searching for Testomgeving section ===\n');

// Find "Het onderzoek is uitgevoerd met:" intro text
const testIntroText = 'Het onderzoek is uitgevoerd met:';
const testIntroIndex = xmlContent.indexOf(testIntroText);

if (testIntroIndex !== -1) {
  console.log('Found testomgeving intro text');

  // Find the paragraph containing this text
  const introParagraphEnd = xmlContent.indexOf('</w:p>', testIntroIndex) + '</w:p>'.length;

  // Find the first browser item after this
  const firstBrowserIndex = xmlContent.indexOf('Google Chrome', introParagraphEnd);

  if (firstBrowserIndex !== -1) {
    console.log('Found browser list items');

    // Find the paragraph containing the first browser
    const browserParagraphStart = xmlContent.lastIndexOf('<w:p ', firstBrowserIndex);
    const browserParagraphEnd = xmlContent.indexOf('</w:p>', firstBrowserIndex) + '</w:p>'.length;
    const browserParagraph = xmlContent.substring(browserParagraphStart, browserParagraphEnd);

    console.log('\n--- First browser paragraph (first 1500 chars) ---');
    console.log(browserParagraph.substring(0, 1500));

    // Extract font sizes
    const fontSizeMatches = browserParagraph.match(/<w:sz w:val="(\d+)"\/>/g);
    if (fontSizeMatches) {
      console.log('\n--- Font sizes in browser paragraph ---');
      fontSizeMatches.forEach((match, i) => {
        const size = match.match(/w:val="(\d+)"/)?.[1];
        const pt = size ? parseInt(size) / 2 : 0;
        console.log(`  ${i + 1}. ${match} -> ${pt}pt`);
      });
    } else {
      console.log('\n--- No explicit font sizes (inheriting from numbering.xml) ---');
    }

    // Extract numId
    const numIdMatch = browserParagraph.match(/<w:numId w:val="(\d+)"\/>/);
    if (numIdMatch) {
      console.log('\n--- List ID ---');
      console.log(`  ${numIdMatch[0]}`);

      // Now check the numbering.xml for this numId
      const numberingXml = zip.file('word/numbering.xml');
      if (numberingXml) {
        const numberingContent = numberingXml.asText();
        const numId = numIdMatch[1];

        console.log(`\n--- Checking numbering.xml for numId="${numId}" ---`);

        // Find the num element with this ID
        const numPattern = new RegExp(`<w:num w:numId="${numId}"[^>]*>.*?</w:num>`, 's');
        const numMatch = numberingContent.match(numPattern);

        if (numMatch) {
          console.log('Found num definition:');
          console.log(numMatch[0]);

          // Extract abstractNumId
          const abstractNumIdMatch = numMatch[0].match(/<w:abstractNumId w:val="(\d+)"\/>/);
          if (abstractNumIdMatch) {
            const abstractNumId = abstractNumIdMatch[1];
            console.log(`\n--- Found abstractNumId="${abstractNumId}" ---`);

            // Find the abstractNum
            const abstractNumPattern = new RegExp(`<w:abstractNum w:abstractNumId="${abstractNumId}"[^>]*>.*?</w:abstractNum>`, 's');
            const abstractNumMatch = numberingContent.match(abstractNumPattern);

            if (abstractNumMatch) {
              console.log('\nFound abstractNum definition (first 1500 chars):');
              console.log(abstractNumMatch[0].substring(0, 1500));

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
              }
            }
          }
        }
      }
    }

    // Check a few more browser items to see if they have explicit font sizes
    console.log('\n\n=== Checking multiple browser items ===');

    const browserItems = ['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'NVDA'];
    browserItems.forEach(browser => {
      const index = xmlContent.indexOf(browser, introParagraphEnd);
      if (index !== -1) {
        const pStart = xmlContent.lastIndexOf('<w:p ', index);
        const pEnd = xmlContent.indexOf('</w:p>', index) + '</w:p>'.length;
        const paragraph = xmlContent.substring(pStart, pEnd);

        const fontSizes = paragraph.match(/<w:sz w:val="(\d+)"\/>/g);
        console.log(`\n${browser}:`);
        if (fontSizes) {
          const uniqueSizes = new Set(fontSizes.map(m => m.match(/w:val="(\d+)"/)?.[1]));
          console.log(`  Font sizes: ${Array.from(uniqueSizes).map(s => `${s} (${parseInt(s || '0') / 2}pt)`).join(', ')}`);
        } else {
          console.log('  No explicit font size (inheriting from list)');
        }
      }
    });
  }
} else {
  console.log('Testomgeving intro text not found');
}

// Also check the Technologieën section
console.log('\n\n=== Checking Technologieën section ===\n');

let techHeadingStart = -1;
let techSearchPos = 0;

while ((techSearchPos = xmlContent.indexOf('>Technologieën<', techSearchPos)) !== -1) {
  const before = xmlContent.substring(Math.max(0, techSearchPos - 300), techSearchPos);
  if (before.includes('pStyle w:val="Kop3"')) {
    techHeadingStart = techSearchPos;
    break;
  }
  techSearchPos++;
}

if (techHeadingStart !== -1) {
  const techHeadingPEnd = xmlContent.indexOf('</w:p>', techHeadingStart) + '</w:p>'.length;

  // Find DOM, HTML, CSS items
  const techItems = ['DOM', 'HTML', 'CSS'];
  techItems.forEach(tech => {
    const index = xmlContent.indexOf(`>${tech}<`, techHeadingPEnd);
    if (index !== -1 && index < techHeadingPEnd + 5000) { // Within reasonable distance
      const pStart = xmlContent.lastIndexOf('<w:p ', index);
      const pEnd = xmlContent.indexOf('</w:p>', index) + '</w:p>'.length;
      const paragraph = xmlContent.substring(pStart, pEnd);

      const fontSizes = paragraph.match(/<w:sz w:val="(\d+)"\/>/g);
      const numIdMatch = paragraph.match(/<w:numId w:val="(\d+)"\/>/);

      console.log(`${tech}:`);
      if (fontSizes) {
        const uniqueSizes = new Set(fontSizes.map(m => m.match(/w:val="(\d+)"/)?.[1]));
        console.log(`  Font sizes: ${Array.from(uniqueSizes).map(s => `${s} (${parseInt(s || '0') / 2}pt)`).join(', ')}`);
      } else {
        console.log('  No explicit font size (inheriting from list)');
      }
      if (numIdMatch) {
        console.log(`  List ID: ${numIdMatch[0]}`);
      }
    }
  });
}