import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function checkTemplateNumbering() {
  const templatePath = path.join(process.cwd(), 'templates', 'formulieren', 'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx');

  const buffer = fs.readFileSync(templatePath);
  const zip = new PizZip(buffer);

  // Check numbering.xml
  const numberingContent = zip.file('word/numbering.xml')?.asText();
  if (numberingContent) {
    console.log('=== NUMBERING.XML ===');
    console.log(numberingContent);
  }

  // Check styles.xml for font definitions
  const stylesContent = zip.file('word/styles.xml')?.asText();
  if (stylesContent) {
    console.log('\n=== STYLES.XML (font sizes) ===');
    // Find all sz (font size) definitions
    const fontSizes = stylesContent.match(/<w:sz w:val="\d+"/g);
    if (fontSizes) {
      console.log('Font sizes found:', [...new Set(fontSizes)]);
    }
  }

  // Check document.xml for Technologieën section
  const docContent = zip.file('word/document.xml')?.asText();
  if (docContent) {
    // Find "Over dit onderzoek" section
    const overditIndex = docContent.indexOf('<w:t>Over dit onderzoek</w:t>');
    if (overditIndex > -1) {
      const sectionSnippet = docContent.substring(overditIndex, overditIndex + 8000);

      // Find first occurrence of "DOM"
      const domIndex = sectionSnippet.indexOf('<w:t>DOM</w:t>');
      if (domIndex > -1) {
        // Get 1000 characters before and after to see the full paragraph structure
        const contextStart = Math.max(0, domIndex - 500);
        const contextEnd = Math.min(sectionSnippet.length, domIndex + 1500);

        console.log('\n=== DOM PARAGRAPH CONTEXT ===');
        console.log(sectionSnippet.substring(contextStart, contextEnd));
      }
    }
  }
}

checkTemplateNumbering().catch(console.error);