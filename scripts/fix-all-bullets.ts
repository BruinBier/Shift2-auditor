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

// Read the template
const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

// Get numbering.xml
const numberingXml = zip.file('word/numbering.xml');
if (!numberingXml) {
  console.error('Could not find word/numbering.xml');
  process.exit(1);
}

let numberingContent = numberingXml.asText();

console.log('Fixing ALL abstractNum definitions to have bullet characters...\n');

// Find all abstractNum definitions
const abstractNumMatches = [...numberingContent.matchAll(/<w:abstractNum w:abstractNumId="(\d+)"[\s\S]*?<\/w:abstractNum>/g)];

let updated = false;

abstractNumMatches.forEach(match => {
  const abstractNumId = match[1];
  const abstractNum = match[0];
  const abstractNumStart = match.index!;
  const abstractNumEnd = abstractNumStart + abstractNum.length;

  // Find level 0
  const lvl0Match = abstractNum.match(/<w:lvl w:ilvl="0">[\s\S]*?<\/w:lvl>/);
  if (!lvl0Match) {
    console.log(`⚠️  AbstractNum ${abstractNumId}: No level 0 found`);
    return;
  }

  const lvl0 = lvl0Match[0];
  const formatMatch = lvl0.match(/<w:numFmt w:val="([^"]+)"/);
  const lvlTextMatch = lvl0.match(/<w:lvlText w:val="([^"]*)"/);

  const format = formatMatch ? formatMatch[1] : 'unknown';
  const lvlText = lvlTextMatch ? lvlTextMatch[1] : null;

  console.log(`AbstractNum ${abstractNumId}:`);
  console.log(`  Current: format="${format}", lvlText="${lvlText === null ? 'NOT FOUND' : '"' + lvlText + '"'}"`);

  // Only fix bullet formats that have empty or missing lvlText
  if (format === 'bullet' && (lvlText === '' || lvlText === null)) {
    console.log(`  ✏️  Fixing: Adding bullet character "·"`);

    // Find the position of this abstractNum in the full content
    const abstractNumInContent = numberingContent.substring(abstractNumStart, abstractNumEnd);

    // Replace empty lvlText with bullet character in the abstractNum
    const newAbstractNum = abstractNumInContent.replace(
      /<w:lvlText w:val=""\/>/,
      '<w:lvlText w:val="·"/>'
    );

    // Replace in the full content
    numberingContent = numberingContent.substring(0, abstractNumStart) +
      newAbstractNum +
      numberingContent.substring(abstractNumEnd);

    updated = true;
    console.log(`  ✅ Fixed`);
  } else if (format === 'bullet' && lvlText !== null && lvlText !== '') {
    console.log(`  ✅ Already has bullet character: "${lvlText}"`);
  } else {
    console.log(`  ⏭️  Skipping (not bullet format or no lvlText element)`);
  }

  console.log();
});

if (!updated) {
  console.log('✅ All bullet formats already have bullet characters!');
  process.exit(0);
}

// Update the ZIP
zip.file('word/numbering.xml', numberingContent);

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.writeFileSync(backupPath, templateContent, 'binary');
console.log('💾 Created backup:', path.basename(backupPath));

// Save the modified template
const output = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

fs.writeFileSync(templatePath, output);
console.log('✅ Updated template:', path.basename(templatePath));
console.log('\n✨ Done! All bullet formats now have bullet characters.');