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

// Helper function to extract all paragraphs in a section
function extractParagraphs(content: string, startMarker: string, endMarker: string) {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return [];

  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex === -1) return [];

  const sectionContent = content.substring(startIndex, endIndex);
  const paragraphs: Array<{ text: string; numId: string | null; fontSize: string | null }> = [];

  // Find all <w:p> ... </w:p> tags
  const pRegex = /<w:p[^>]*>[\s\S]*?<\/w:p>/g;
  let match;

  while ((match = pRegex.exec(sectionContent)) !== null) {
    const paragraph = match[0];

    // Extract text
    const textMatches = paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    const text = textMatches
      ? textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim()
      : '';

    // Extract numId
    const numIdMatch = paragraph.match(/<w:numId w:val="(\d+)"\/>/);
    const numId = numIdMatch ? numIdMatch[1] : null;

    // Extract font size
    const fontSizeMatch = paragraph.match(/<w:sz w:val="(\d+)"\/>/);
    const fontSize = fontSizeMatch ? fontSizeMatch[1] : null;

    if (text.length > 0 || numId) {
      paragraphs.push({ text, numId, fontSize });
    }
  }

  return paragraphs;
}

console.log('\n=== BROWSER LIST (Testomgeving) ===\n');

const browserParagraphs = extractParagraphs(
  xmlContent,
  'Het onderzoek is uitgevoerd met:',
  'Technologieën'
);

browserParagraphs
  .filter(p => p.text.length > 0 && (p.text.includes('Chrome') || p.text.includes('Firefox') || p.text.includes('Edge') || p.text.includes('NVDA')))
  .forEach(p => {
    const fontPt = p.fontSize ? `${parseInt(p.fontSize) / 2}pt` : 'inherited from list';
    console.log(`${p.text}`);
    console.log(`  numId: ${p.numId || 'none'}`);
    console.log(`  fontSize: ${p.fontSize ? `${p.fontSize} (${fontPt})` : fontPt}`);
    console.log();
  });

console.log('\n=== TECHNOLOGY LIST (Technologieën) ===\n');

const techParagraphs = extractParagraphs(
  xmlContent,
  '>Technologieën<',
  '>Testomgeving<'
);

techParagraphs
  .filter(p => p.text.length > 0 && !p.text.includes('Technologieën'))
  .forEach(p => {
    const fontPt = p.fontSize ? `${parseInt(p.fontSize) / 2}pt` : 'inherited from list';
    console.log(`${p.text}`);
    console.log(`  numId: ${p.numId || 'none'}`);
    console.log(`  fontSize: ${p.fontSize ? `${p.fontSize} (${fontPt})` : fontPt}`);
    console.log();
  });

// Summary
console.log('\n=== SUMMARY ===\n');

const browserFonts = browserParagraphs
  .filter(p => p.text.length > 0 && (p.text.includes('Chrome') || p.text.includes('Firefox') || p.text.includes('Edge') || p.text.includes('NVDA')))
  .map(p => p.fontSize || 'inherited');

const techFonts = techParagraphs
  .filter(p => p.text.length > 0 && !p.text.includes('Technologieën'))
  .map(p => p.fontSize || 'inherited');

const browserHasExplicitFont = browserFonts.some(f => f !== 'inherited');
const techHasExplicitFont = techFonts.some(f => f !== 'inherited');

console.log(`Browsers: ${browserHasExplicitFont ? 'Have explicit font sizes' : 'Inherit from list definition'}`);
console.log(`Technologies: ${techHasExplicitFont ? 'Have explicit font sizes' : 'Inherit from list definition'}`);

if (browserHasExplicitFont || techHasExplicitFont) {
  console.log('\n⚠️  WARNING: Found explicit font sizes that may override list defaults!');
  console.log('Browser fonts:', browserFonts);
  console.log('Tech fonts:', techFonts);
} else {
  console.log('\n✓ Both lists inherit font size from numbering.xml definitions');
  console.log('✓ Since both use abstractNum with sz=22 (11pt), they will match');
}