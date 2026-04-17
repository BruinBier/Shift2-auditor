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

// Check document.xml
const documentXml = zip.file('word/document.xml');
if (documentXml) {
  let xmlContent = documentXml.asText();

  // Find Bevindingen section
  let bevindingenStart = xmlContent.indexOf('>Bevindingen<');
  if (bevindingenStart !== -1) {
    console.log('\n=== Bevindingen Section ===');

    // Get content after "Bevindingen" heading
    const sectionContent = xmlContent.substring(bevindingenStart, bevindingenStart + 10000);

    // Find paragraphs with numId in bevindingen section
    const numIdMatches = sectionContent.match(/<w:numId w:val="\d+"\/>/g);
    if (numIdMatches) {
      console.log('Found numId references:', [...new Set(numIdMatches)]);
    }

    // Get first paragraph with bullets in bevindingen
    const firstBulletMatch = sectionContent.match(/<w:p[^>]*>[\s\S]*?<w:numPr>[\s\S]*?<w:numId w:val="(\d+)"[\s\S]*?<\/w:p>/);
    if (firstBulletMatch) {
      console.log('\nFirst bulleted paragraph in Bevindingen:');
      console.log('Uses numId:', firstBulletMatch[1]);
      console.log(firstBulletMatch[0].substring(0, 600) + '...');
    } else {
      console.log('\n❌ No bulleted paragraphs found in Bevindingen section');
    }
  } else {
    console.log('\n❌ Could not find "Bevindingen" section');
  }
}

// Check numbering.xml - show all abstractNum configurations
const numberingXml = zip.file('word/numbering.xml');
if (numberingXml) {
  const numberingContent = numberingXml.asText();

  console.log('\n=== All AbstractNum Configurations ===');

  // Find all abstractNum definitions
  const abstractNums = numberingContent.match(/<w:abstractNum w:abstractNumId="\d+"[\s\S]*?<\/w:abstractNum>/g);

  if (abstractNums) {
    abstractNums.forEach(abstractNum => {
      const idMatch = abstractNum.match(/abstractNumId="(\d+)"/);
      const id = idMatch ? idMatch[1] : 'unknown';

      // Get first level
      const lvl0Match = abstractNum.match(/<w:lvl w:ilvl="0">[\s\S]*?<\/w:lvl>/);
      if (lvl0Match) {
        const lvl0 = lvl0Match[0];

        const formatMatch = lvl0.match(/<w:numFmt w:val="([^"]+)"/);
        const lvlTextMatch = lvl0.match(/<w:lvlText w:val="([^"]*)"/);
        const fontMatch = lvl0.match(/<w:rFonts[^>]*>/);
        const indMatch = lvl0.match(/<w:ind[^>]*>/);

        console.log(`\nAbstractNum ${id}:`);
        console.log('  Format:', formatMatch ? formatMatch[1] : 'NOT FOUND');
        console.log('  LvlText:', lvlTextMatch ? `"${lvlTextMatch[1]}"` : 'NOT FOUND');
        console.log('  Font:', fontMatch ? fontMatch[0] : 'NOT FOUND');
        console.log('  Indentation:', indMatch ? indMatch[0] : 'NOT FOUND');
      }
    });
  }

  console.log('\n=== Num Instances (numId → abstractNumId mapping) ===');
  const numInstances = numberingContent.match(/<w:num w:numId="\d+"[\s\S]*?<\/w:num>/g);
  if (numInstances) {
    numInstances.forEach(num => {
      const numIdMatch = num.match(/w:numId="(\d+)"/);
      const abstractNumIdMatch = num.match(/w:val="(\d+)"/);
      console.log(`numId ${numIdMatch?.[1]} → abstractNumId ${abstractNumIdMatch?.[1]}`);
    });
  }
}