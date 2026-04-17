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

// Read document.xml
const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

console.log('\n=== Checking Technologieën section in document.xml ===\n');

// Find "Technologieën" heading
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
  console.log('Found Technologieën heading');

  // Find the section content
  const techHeadingPEnd = xmlContent.indexOf('</w:p>', techHeadingStart) + '</w:p>'.length;

  // Find the next heading
  const afterTechHeading = xmlContent.substring(techHeadingPEnd);
  const nextHeadingMatch = afterTechHeading.search(/<w:pStyle w:val="Kop[2-3]"/);

  if (nextHeadingMatch !== -1) {
    const techContent = afterTechHeading.substring(0, nextHeadingMatch);

    console.log('\n--- Raw content (first 2000 chars) ---');
    console.log(techContent.substring(0, 2000));

    // Find font sizes in this section
    const fontSizeMatches = techContent.match(/<w:sz w:val="(\d+)"\/>/g);
    if (fontSizeMatches) {
      console.log('\n--- Font sizes in Technologieën section ---');
      const uniqueSizes = new Set(fontSizeMatches);
      uniqueSizes.forEach(match => {
        const size = match.match(/w:val="(\d+)"/)?.[1];
        const pt = size ? parseInt(size) / 2 : 0;
        const count = fontSizeMatches.filter(m => m === match).length;
        console.log(`  ${match} -> ${pt}pt (${count} occurrences)`);
      });
    } else {
      console.log('\n--- No explicit font sizes found (using defaults from numbering.xml) ---');
    }

    // Check which numId is used
    const numIdMatches = techContent.match(/<w:numId w:val="(\d+)"\/>/g);
    if (numIdMatches) {
      console.log('\n--- List IDs used in Technologieën section ---');
      const uniqueNumIds = new Set(numIdMatches);
      uniqueNumIds.forEach(match => {
        const numId = match.match(/w:val="(\d+)"/)?.[1];
        const count = numIdMatches.filter(m => m === match).length;
        console.log(`  ${match} (${count} occurrences)`);
      });
    }

    // Extract list items text
    const textMatches = techContent.match(/<w:t>([^<]+)<\/w:t>/g);
    if (textMatches) {
      console.log('\n--- Text content in Technologieën section ---');
      textMatches.forEach(match => {
        const text = match.match(/<w:t>([^<]+)<\/w:t>/)?.[1];
        if (text && text.trim().length > 0) {
          console.log(`  - ${text}`);
        }
      });
    }
  }
} else {
  console.log('Technologieën section not found');
}

// Also check if there are any hardcoded font sizes in the DOM/HTML/CSS items
console.log('\n\n=== Searching for DOM, HTML, CSS items ===\n');

const domIndex = xmlContent.indexOf('>DOM<');
const htmlIndex = xmlContent.indexOf('>HTML<');
const cssIndex = xmlContent.indexOf('>CSS<');

if (domIndex !== -1) {
  console.log('Found DOM item');
  const domParagraph = xmlContent.substring(
    xmlContent.lastIndexOf('<w:p ', domIndex),
    xmlContent.indexOf('</w:p>', domIndex) + '</w:p>'.length
  );

  const fontSizes = domParagraph.match(/<w:sz w:val="(\d+)"\/>/g);
  if (fontSizes) {
    console.log('  Font sizes in DOM paragraph:', fontSizes.map(m => {
      const s = m.match(/w:val="(\d+)"/)?.[1];
      return `${s} (${parseInt(s || '0') / 2}pt)`;
    }).join(', '));
  } else {
    console.log('  No explicit font size (inheriting from list definition)');
  }
}

if (htmlIndex !== -1) {
  console.log('\nFound HTML item');
  const htmlParagraph = xmlContent.substring(
    xmlContent.lastIndexOf('<w:p ', htmlIndex),
    xmlContent.indexOf('</w:p>', htmlIndex) + '</w:p>'.length
  );

  const fontSizes = htmlParagraph.match(/<w:sz w:val="(\d+)"\/>/g);
  if (fontSizes) {
    console.log('  Font sizes in HTML paragraph:', fontSizes.map(m => {
      const s = m.match(/w:val="(\d+)"/)?.[1];
      return `${s} (${parseInt(s || '0') / 2}pt)`;
    }).join(', '));
  } else {
    console.log('  No explicit font size (inheriting from list definition)');
  }
}

if (cssIndex !== -1) {
  console.log('\nFound CSS item');
  const cssParagraph = xmlContent.substring(
    xmlContent.lastIndexOf('<w:p ', cssIndex),
    xmlContent.indexOf('</w:p>', cssIndex) + '</w:p>'.length
  );

  const fontSizes = cssParagraph.match(/<w:sz w:val="(\d+)"\/>/g);
  if (fontSizes) {
    console.log('  Font sizes in CSS paragraph:', fontSizes.map(m => {
      const s = m.match(/w:val="(\d+)"/)?.[1];
      return `${s} (${parseInt(s || '0') / 2}pt)`;
    }).join(', '));
  } else {
    console.log('  No explicit font size (inheriting from list definition)');
  }
}