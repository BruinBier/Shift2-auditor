import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Check numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (numberingXml) {
  const numberingContent = numberingXml.asText();

  // Find abstractNum 0
  const abstractNum0Match = numberingContent.match(/<w:abstractNum w:abstractNumId="0"[\s\S]*?<\/w:abstractNum>/);

  if (abstractNum0Match) {
    console.log('\n=== AbstractNum 0 (Sample Items) ===');
    const abstractNum0 = abstractNum0Match[0];

    // Extract level 0
    const lvl0Match = abstractNum0.match(/<w:lvl w:ilvl="0">[\s\S]*?<\/w:lvl>/);
    if (lvl0Match) {
      const lvl0 = lvl0Match[0];

      // Check format
      const formatMatch = lvl0.match(/<w:numFmt w:val="([^"]+)"/);
      console.log('Format:', formatMatch ? formatMatch[1] : 'NOT FOUND');

      // Check lvlText
      const lvlTextMatch = lvl0.match(/<w:lvlText w:val="([^"]*)"/);
      console.log('LvlText:', lvlTextMatch ? `"${lvlTextMatch[1]}"` : 'NOT FOUND');

      // Check indentation
      const indMatch = lvl0.match(/<w:ind[^>]*>/);
      console.log('Indentation:', indMatch ? indMatch[0] : 'NOT FOUND');

      // Check font
      const fontMatch = lvl0.match(/<w:rFonts[^>]*>/);
      console.log('Font:', fontMatch ? fontMatch[0] : 'NOT FOUND');

      console.log('\nFull lvl 0:');
      console.log(lvl0);
    }
  }
}

// Check document.xml for sample items
const documentXml = zip.file('word/document.xml');
if (documentXml) {
  let xmlContent = documentXml.asText();

  // Find Volledige steekproef section
  let steekproefStart = xmlContent.indexOf('Volledige steekproef');
  if (steekproefStart !== -1) {
    console.log('\n=== Sample Items in Document ===');

    // Get a section after the heading
    const sectionContent = xmlContent.substring(steekproefStart, steekproefStart + 5000);

    // Find paragraphs with numId="3"
    const numId3Matches = sectionContent.match(/<w:numId w:val="3"\/>/g);
    console.log('Found', numId3Matches ? numId3Matches.length : 0, 'paragraphs with numId="3"');

    // Get first sample item paragraph
    const firstItemMatch = sectionContent.match(/<w:p[^>]*>[\s\S]*?<w:numPr>[\s\S]*?<w:numId w:val="3"[\s\S]*?<\/w:p>/);
    if (firstItemMatch) {
      console.log('\nFirst sample item paragraph:');
      console.log(firstItemMatch[0].substring(0, 500) + '...');
    }
  } else {
    console.log('\n❌ Could not find "Volledige steekproef" section');
  }
}

console.log('\n=== Checking all abstractNum definitions ===');
const numberingContent = numberingXml?.asText() || '';
const allAbstractNums = numberingContent.match(/<w:abstractNum w:abstractNumId="\d+"[\s\S]*?<\/w:abstractNum>/g);
if (allAbstractNums) {
  allAbstractNums.forEach((abstractNum, index) => {
    const idMatch = abstractNum.match(/abstractNumId="(\d+)"/);
    const formatMatch = abstractNum.match(/<w:numFmt w:val="([^"]+)"/);
    console.log(`AbstractNum ${idMatch?.[1]}: format = ${formatMatch?.[1] || 'NONE'}`);
  });
}

console.log('\n=== Checking num instances ===');
const numInstances = numberingContent.match(/<w:num w:numId="\d+"[\s\S]*?<\/w:num>/g);
if (numInstances) {
  numInstances.forEach(num => {
    const numIdMatch = num.match(/w:numId="(\d+)"/);
    const abstractNumIdMatch = num.match(/w:val="(\d+)"/);
    console.log(`numId ${numIdMatch?.[1]} → abstractNumId ${abstractNumIdMatch?.[1]}`);
  });
}