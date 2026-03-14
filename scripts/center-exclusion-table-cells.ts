import PizZip from 'pizzip';
import fs from 'fs';

const templatePath = './templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx';

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`Created backup: ${backupPath}`);

// Load template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml')!.asText();

console.log('=== Centering exclusion table cells ===\n');

// Find the table containing "Reden van uitsluiting"
const redenPos = xml.indexOf('Reden van uitsluiting');
if (redenPos === -1) {
  console.log('ERROR: Could not find "Reden van uitsluiting" text');
  process.exit(1);
}

console.log('Found "Reden van uitsluiting" at position:', redenPos);

// Find the table containing this text
const tableStart = xml.lastIndexOf('<w:tbl', redenPos);
const tableEnd = xml.indexOf('</w:tbl>', redenPos) + '</w:tbl>'.length;

if (tableStart === -1 || tableEnd <= tableStart) {
  console.log('ERROR: Could not find table boundaries');
  process.exit(1);
}

const table = xml.substring(tableStart, tableEnd);
console.log('Found table, length:', table.length);

// Count cells
const cellCount = (table.match(/<w:tc>/g) || []).length;
console.log('Number of cells:', cellCount);

// Replace table with vertically centered cells
let updatedTable = table;
let changedCount = 0;

// For each cell, add or update vAlign to center
// Pattern: <w:tcPr>...</w:tcPr> inside <w:tc>...</w:tc>
const cellPattern = /<w:tc>(.*?)<\/w:tc>/gs;
let cellMatch;

const cells: string[] = [];
while ((cellMatch = cellPattern.exec(table)) !== null) {
  cells.push(cellMatch[0]);
}

console.log(`Processing ${cells.length} cells...\n`);

cells.forEach((cell, index) => {
  const hasTcPr = cell.includes('<w:tcPr>');
  const hasVAlign = cell.includes('<w:vAlign');

  let updatedCell = cell;

  if (hasVAlign) {
    // Replace existing vAlign with center
    updatedCell = cell.replace(/<w:vAlign w:val="[^"]*"\/>/g, '<w:vAlign w:val="center"/>');
    console.log(`Cell ${index + 1}: Updated existing vAlign to center`);
  } else if (hasTcPr) {
    // Add vAlign to existing tcPr
    updatedCell = cell.replace(/<w:tcPr>/, '<w:tcPr><w:vAlign w:val="center"/>');
    console.log(`Cell ${index + 1}: Added vAlign to existing tcPr`);
  } else {
    // Add tcPr with vAlign
    updatedCell = cell.replace(/<w:tc>/, '<w:tc><w:tcPr><w:vAlign w:val="center"/></w:tcPr>');
    console.log(`Cell ${index + 1}: Added tcPr with vAlign`);
  }

  if (updatedCell !== cell) {
    updatedTable = updatedTable.replace(cell, updatedCell);
    changedCount++;
  }
});

// Replace the table in the XML
xml = xml.substring(0, tableStart) + updatedTable + xml.substring(tableEnd);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log(`\n✓ Updated ${changedCount} cells`);
console.log('  All cells in the exclusion table are now vertically centered');