import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// This script inspects a generated Word document to see the actual XML
// Run this after generating a Word document to debug font size issues

async function inspectGeneratedDoc() {
  // Find the most recent .docx file in downloads or current directory
  const docxPath = process.argv[2];

  if (!docxPath) {
    console.error('Please provide path to .docx file as argument');
    console.error('Usage: npx tsx scripts/inspect-generated-doc.ts path/to/rapport.docx');
    process.exit(1);
  }

  if (!fs.existsSync(docxPath)) {
    console.error('File not found:', docxPath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(docxPath);
  const zip = new PizZip(buffer);

  // Check document.xml for Technologieën section
  const docContent = zip.file('word/document.xml')?.asText();
  if (docContent) {
    // Find "Technologieën" heading
    const techHeadingIndex = docContent.indexOf('>Technologieën<');
    if (techHeadingIndex > -1) {
      // Get 3000 characters after the heading
      const sectionSnippet = docContent.substring(techHeadingIndex, techHeadingIndex + 3000);

      console.log('\n=== TECHNOLOGIEËN SECTION IN GENERATED DOCUMENT ===');
      console.log(sectionSnippet);

      // Extract all font size values in this section
      const fontSizes = sectionSnippet.match(/<w:sz w:val="(\d+)"/g);
      if (fontSizes) {
        console.log('\n=== FONT SIZES FOUND ===');
        fontSizes.forEach(match => {
          const val = match.match(/val="(\d+)"/)?.[1];
          if (val) {
            const pt = parseInt(val) / 2;
            console.log(`${match} → ${pt}pt`);
          }
        });
      }

      // Find DOM, HTML, CSS paragraphs
      const domMatch = sectionSnippet.match(/<w:p[^>]*>[\s\S]{0,500}?<w:t[^>]*>DOM<\/w:t>[\s\S]{0,100}?<\/w:p>/);
      if (domMatch) {
        console.log('\n=== DOM PARAGRAPH ===');
        console.log(domMatch[0]);
      }
    } else {
      console.log('Technologieën heading not found in document');
    }
  }

  // Check numbering.xml
  const numberingContent = zip.file('word/numbering.xml')?.asText();
  if (numberingContent) {
    console.log('\n=== NUMBERING.XML abstractNum 2 (technologies list) ===');

    const abstractNum2Start = numberingContent.indexOf('<w:abstractNum w:abstractNumId="2"');
    if (abstractNum2Start > -1) {
      const abstractNum2End = numberingContent.indexOf('</w:abstractNum>', abstractNum2Start);
      const abstractNum2Content = numberingContent.substring(abstractNum2Start, abstractNum2End + '</w:abstractNum>'.length);

      // Find lvl 0
      const lvl0Match = abstractNum2Content.match(/<w:lvl w:ilvl="0">[\s\S]*?<\/w:lvl>/);
      if (lvl0Match) {
        console.log(lvl0Match[0]);

        // Extract font size
        const szMatch = lvl0Match[0].match(/<w:sz w:val="(\d+)"/);
        if (szMatch) {
          const pt = parseInt(szMatch[1]) / 2;
          console.log(`\nFont size in numbering definition: ${szMatch[1]} half-points = ${pt}pt`);
        }
      }
    }
  }

  // Check styles.xml for any Brockmann font definitions
  const stylesContent = zip.file('word/styles.xml')?.asText();
  if (stylesContent) {
    console.log('\n=== STYLES.XML - Brockmann font sizes ===');

    const brockmannMatches = stylesContent.match(/<w:rFonts[^>]*Brockmann[^>]*>[\s\S]{0,200}?<w:sz w:val="(\d+)"/g);
    if (brockmannMatches) {
      brockmannMatches.forEach(match => {
        console.log(match);
      });
    }
  }
}

inspectGeneratedDoc().catch(console.error);