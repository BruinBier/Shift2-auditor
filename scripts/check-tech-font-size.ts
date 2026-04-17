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

// Read numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (numberingXml) {
  const numberingContent = numberingXml.asText();

  console.log('\n=== Checking abstractNum 2 (Technologies) ===\n');

  // Find abstractNum with abstractNumId="2"
  const abstractNum2Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="2"');
  if (abstractNum2Start !== -1) {
    const abstractNum2End = numberingContent.indexOf('</w:abstractNum>', abstractNum2Start);
    const abstractNum2Content = numberingContent.substring(abstractNum2Start, abstractNum2End + '</w:abstractNum>'.length);

    console.log('Found abstractNum 2:');
    console.log(abstractNum2Content);

    // Extract font size
    const fontSizeMatches = abstractNum2Content.match(/<w:sz w:val="(\d+)"\/>/g);
    if (fontSizeMatches) {
      console.log('\nFont sizes found in abstractNum 2:');
      fontSizeMatches.forEach((match, i) => {
        const size = match.match(/w:val="(\d+)"/)?.[1];
        const pt = size ? parseInt(size) / 2 : 0;
        console.log(`  ${i + 1}. ${match} -> ${pt}pt`);
      });
    } else {
      console.log('\nNo font sizes found in abstractNum 2');
    }
  } else {
    console.log('abstractNum 2 not found');
  }

  console.log('\n=== Checking abstractNum 1 (Browsers) ===\n');

  // Find abstractNum with abstractNumId="1"
  const abstractNum1Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="1"');
  if (abstractNum1Start !== -1) {
    const abstractNum1End = numberingContent.indexOf('</w:abstractNum>', abstractNum1Start);
    const abstractNum1Content = numberingContent.substring(abstractNum1Start, abstractNum1End + '</w:abstractNum>'.length);

    console.log('Found abstractNum 1:');
    console.log(abstractNum1Content);

    // Extract font size
    const fontSizeMatches = abstractNum1Content.match(/<w:sz w:val="(\d+)"\/>/g);
    if (fontSizeMatches) {
      console.log('\nFont sizes found in abstractNum 1:');
      fontSizeMatches.forEach((match, i) => {
        const size = match.match(/w:val="(\d+)"/)?.[1];
        const pt = size ? parseInt(size) / 2 : 0;
        console.log(`  ${i + 1}. ${match} -> ${pt}pt`);
      });
    } else {
      console.log('\nNo font sizes found in abstractNum 1');
    }
  } else {
    console.log('abstractNum 1 not found');
  }
} else {
  console.log('numbering.xml not found in template');
}

// Now check the actual document.xml for Technologies section
const documentXml = zip.file('word/document.xml');
if (documentXml) {
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
    // Find the section content
    const techHeadingPEnd = xmlContent.indexOf('</w:p>', techHeadingStart) + '</w:p>'.length;

    // Find the next heading
    const afterTechHeading = xmlContent.substring(techHeadingPEnd);
    const nextHeadingMatch = afterTechHeading.search(/<w:pStyle w:val="Kop[2-3]"/);

    if (nextHeadingMatch !== -1) {
      const techContent = afterTechHeading.substring(0, nextHeadingMatch);

      console.log('Found Technologieën section content (first 1000 chars):');
      console.log(techContent.substring(0, 1000));

      // Find font sizes in this section
      const fontSizeMatches = techContent.match(/<w:sz w:val="(\d+)"\/>/g);
      if (fontSizeMatches) {
        console.log('\nFont sizes in Technologieën section:');
        const uniqueSizes = new Set(fontSizeMatches);
        uniqueSizes.forEach(match => {
          const size = match.match(/w:val="(\d+)"/)?.[1];
          const pt = size ? parseInt(size) / 2 : 0;
          console.log(`  ${match} -> ${pt}pt`);
        });
      } else {
        console.log('\nNo explicit font sizes found in Technologieën section (using defaults)');
      }

      // Check which numId is used
      const numIdMatches = techContent.match(/<w:numId w:val="(\d+)"\/>/g);
      if (numIdMatches) {
        console.log('\nList IDs used in Technologieën section:');
        const uniqueNumIds = new Set(numIdMatches);
        uniqueNumIds.forEach(match => {
          console.log(`  ${match}`);
        });
      }
    }
  } else {
    console.log('Technologieën section not found');
  }
}