import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml')!.asText();

console.log('=== Checking Bevindingen Section Headings ===\n');

// Find Bevindingen Kop2
let searchPos = 0;
while ((searchPos = xml.indexOf('Bevindingen', searchPos)) !== -1) {
  const before = xml.substring(Math.max(0, searchPos - 300), searchPos);
  if (before.includes('pStyle w:val="Kop2"')) {
    console.log('1. BEVINDINGEN HEADING');

    const pStart = Math.max(
      xml.lastIndexOf('<w:p ', searchPos),
      xml.lastIndexOf('<w:p>', searchPos)
    );
    const pEnd = xml.indexOf('</w:p>', searchPos) + '</w:p>'.length;
    const paragraph = xml.substring(pStart, pEnd);

    const styleMatch = paragraph.match(/pStyle w:val="([^"]+)"/);
    console.log('   Text: "Bevindingen"');
    console.log('   Style:', styleMatch ? styleMatch[1] : 'NONE');
    console.log('   ✓ Has Kop2:', styleMatch && styleMatch[1] === 'Kop2' ? 'YES' : 'NO');

    // Now find 1.3.3
    const headingEnd = pEnd;
    const criterionPos = xml.indexOf('1.3.3 Zintuiglijke eigenschappen A', headingEnd);

    if (criterionPos !== -1 && criterionPos < headingEnd + 1000) {
      console.log('\n2. CRITERION HEADING');

      const cStart = Math.max(
        xml.lastIndexOf('<w:p ', criterionPos),
        xml.lastIndexOf('<w:p>', criterionPos)
      );
      const cEnd = xml.indexOf('</w:p>', criterionPos) + '</w:p>'.length;
      const cParagraph = xml.substring(cStart, cEnd);

      const cStyleMatch = cParagraph.match(/pStyle w:val="([^"]+)"/);
      console.log('   Text: "1.3.3 Zintuiglijke eigenschappen A"');
      console.log('   Style:', cStyleMatch ? cStyleMatch[1] : 'NONE');
      console.log('   ✓ Has Kop3:', cStyleMatch && cStyleMatch[1] === 'Kop3' ? 'YES' : 'NO');
    }

    break;
  }
  searchPos++;
}

// Check if styles exist in styles.xml
console.log('\n=== Checking styles.xml for Kop2 and Kop3 definitions ===\n');

const stylesXml = zip.file('word/styles.xml');
if (stylesXml) {
  const stylesContent = stylesXml.asText();

  const kop2Match = stylesContent.match(/<w:style[^>]*w:styleId="Kop2"[^>]*>/);
  const kop3Match = stylesContent.match(/<w:style[^>]*w:styleId="Kop3"[^>]*>/);

  console.log('Kop2 style defined:', kop2Match ? 'YES ✓' : 'NO ✗');
  console.log('Kop3 style defined:', kop3Match ? 'YES ✓' : 'NO ✗');

  // Also check for alternative names
  const heading2Match = stylesContent.match(/<w:style[^>]*w:styleId="Heading2"[^>]*>/);
  const heading3Match = stylesContent.match(/<w:style[^>]*w:styleId="Heading3"[^>]*>/);

  console.log('Heading2 style defined:', heading2Match ? 'YES ✓' : 'NO ✗');
  console.log('Heading3 style defined:', heading3Match ? 'YES ✓' : 'NO ✗');
} else {
  console.log('styles.xml not found in document!');
}