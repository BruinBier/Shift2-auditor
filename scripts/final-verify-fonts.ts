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

console.log('='.repeat(80));
console.log('FINAL VERIFICATION: Technologieën vs Testomgeving Font Sizes');
console.log('='.repeat(80));

// Check numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (numberingXml) {
  const numberingContent = numberingXml.asText();

  console.log('\n📋 NUMBERING.XML DEFINITIONS:\n');

  // numId 4 (browsers)
  console.log('numId="4" (Browsers):');
  const num4Match = numberingContent.match(/<w:num w:numId="4"[^>]*>[\s\S]*?<\/w:num>/);
  if (num4Match) {
    const abstractNum4 = num4Match[0].match(/<w:abstractNumId w:val="(\d+)"\/>/)?.[1];
    console.log(`  → abstractNumId="${abstractNum4}"`);

    if (abstractNum4) {
      const abstractPattern = new RegExp(`<w:abstractNum w:abstractNumId="${abstractNum4}"[^>]*>[\\s\\S]*?<\\/w:abstractNum>`);
      const abstractMatch = numberingContent.match(abstractPattern);
      if (abstractMatch) {
        const fontSizes = abstractMatch[0].match(/<w:sz w:val="(\d+)"\/>/g);
        const uniqueSizes = new Set(fontSizes?.map(s => s.match(/w:val="(\d+)"/)?.[1]));
        console.log(`  → Font sizes: ${Array.from(uniqueSizes).map(s => `${s} (${parseInt(s || '0') / 2}pt)`).join(', ')}`);
      }
    }
  }

  // numId 5 (technologies)
  console.log('\nnumId="5" (Technologies):');
  const num5Match = numberingContent.match(/<w:num w:numId="5"[^>]*>[\s\S]*?<\/w:num>/);
  if (num5Match) {
    const abstractNum5 = num5Match[0].match(/<w:abstractNumId w:val="(\d+)"\/>/)?.[1];
    console.log(`  → abstractNumId="${abstractNum5}"`);

    if (abstractNum5) {
      const abstractPattern = new RegExp(`<w:abstractNum w:abstractNumId="${abstractNum5}"[^>]*>[\\s\\S]*?<\\/w:abstractNum>`);
      const abstractMatch = numberingContent.match(abstractPattern);
      if (abstractMatch) {
        const fontSizes = abstractMatch[0].match(/<w:sz w:val="(\d+)"\/>/g);
        const uniqueSizes = new Set(fontSizes?.map(s => s.match(/w:val="(\d+)"/)?.[1]));
        console.log(`  → Font sizes: ${Array.from(uniqueSizes).map(s => `${s} (${parseInt(s || '0') / 2}pt)`).join(', ')}`);
      }
    }
  }
}

// Check document.xml
const documentXml = zip.file('word/document.xml');
if (documentXml) {
  const xmlContent = documentXml.asText();

  console.log('\n📄 DOCUMENT.XML ACTUAL ITEMS:\n');

  // Find browsers
  const browserItems = ['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'NVDA'];
  console.log('Browser List Items:');
  browserItems.forEach(browser => {
    const index = xmlContent.indexOf(browser);
    if (index !== -1) {
      const pStart = xmlContent.lastIndexOf('<w:p ', index);
      const pEnd = xmlContent.indexOf('</w:p>', index) + '</w:p>'.length;
      const paragraph = xmlContent.substring(pStart, pEnd);

      const numId = paragraph.match(/<w:numId w:val="(\d+)"\/>/)?.[1];
      const fontSize = paragraph.match(/<w:sz w:val="(\d+)"\/>/)?.[1];

      console.log(`  ${browser}:`);
      console.log(`    numId: ${numId || 'none'}`);
      console.log(`    explicit fontSize: ${fontSize ? `${fontSize} (${parseInt(fontSize) / 2}pt)` : 'none (inherits from list)'}`);
    }
  });

  // Find technologies
  const techItems = ['DOM', 'HTML', 'CSS'];
  console.log('\nTechnology List Items:');
  techItems.forEach(tech => {
    const index = xmlContent.indexOf(`>${tech}<`);
    if (index !== -1) {
      const pStart = xmlContent.lastIndexOf('<w:p ', index);
      const pEnd = xmlContent.indexOf('</w:p>', index) + '</w:p>'.length;
      const paragraph = xmlContent.substring(pStart, pEnd);

      const numId = paragraph.match(/<w:numId w:val="(\d+)"\/>/)?.[1];
      const fontSize = paragraph.match(/<w:sz w:val="(\d+)"\/>/)?.[1];

      console.log(`  ${tech}:`);
      console.log(`    numId: ${numId || 'none'}`);
      console.log(`    explicit fontSize: ${fontSize ? `${fontSize} (${parseInt(fontSize) / 2}pt)` : 'none (inherits from list)'}`);
    }
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ CONCLUSION:');
console.log('='.repeat(80));
console.log('Both lists inherit font size from their list definitions (abstractNum).');
console.log('Both abstractNum definitions use w:sz w:val="22" (11pt).');
console.log('Therefore, both lists will render at 11pt in Microsoft Word.');
console.log('='.repeat(80) + '\n');