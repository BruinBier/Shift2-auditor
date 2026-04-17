import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const stylesXml = zip.file('word/styles.xml')!.asText();

console.log('=== Checking Inhopg styles ===\n');

// Find Inhopg1, Inhopg2, Inhopg3 styles
const inhopgStyles = ['Inhopg1', 'Inhopg2', 'Inhopg3'];

inhopgStyles.forEach(styleName => {
  // Find the style definition
  const stylePattern = new RegExp(`<w:style[^>]*w:styleId="${styleName}"[^>]*>.*?</w:style>`, 's');
  const styleMatch = stylesXml.match(stylePattern);

  if (styleMatch) {
    console.log(`\n=== ${styleName} ===`);
    const styleDef = styleMatch[0];

    // Check for indentation
    const indMatch = styleDef.match(/<w:ind w:left="(\d+)"/);
    const hangingMatch = styleDef.match(/<w:ind[^>]*w:hanging="(\d+)"/);

    if (indMatch) {
      console.log(`Left indent: ${indMatch[1]} twips (${Math.round(parseInt(indMatch[1]) / 20)} pt)`);
    } else {
      console.log('No left indent');
    }

    if (hangingMatch) {
      console.log(`Hanging indent: ${hangingMatch[1]} twips`);
    }

    // Show first 300 chars of style
    console.log('\nStyle definition (first 300 chars):');
    console.log(styleDef.substring(0, 300));
  } else {
    console.log(`\n${styleName}: NOT FOUND`);
  }
});