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

console.log('=== Replacing "Onderzoek scores" with "Onderzoeksscores" ===\n');

// Count occurrences before
const beforeCount = (xml.match(/Onderzoek scores/g) || []).length;
console.log(`Found ${beforeCount} occurrence(s)`);

// Replace all occurrences
// This will handle both "Onderzoek scores" (two separate text runs) and "Onderzoek scores" in one run
let replacedCount = 0;

// Simple replacement for cases where it's in a single <w:t> tag
xml = xml.replace(/Onderzoek scores/g, 'Onderzoeksscores');
replacedCount = beforeCount;

// Also handle cases where "Onderzoek" and "scores" might be in separate text runs
// Pattern: <w:t>Onderzoek</w:t></w:r><w:r><w:t> scores</w:t>
const splitPattern = /(<w:t[^>]*>Onderzoek<\/w:t><\/w:r>)(\s*<w:r[^>]*><w:t[^>]*>) scores(<\/w:t>)/g;
xml = xml.replace(splitPattern, '$1$2onderzoeksscores$3');

// Verify
const afterCount = (xml.match(/Onderzoeksscores/g) || []).length;

console.log(`\nReplaced ${replacedCount} occurrence(s)`);
console.log(`Now found ${afterCount} occurrence(s) of "Onderzoeksscores"`);

// Update ZIP
zip.file('word/document.xml', xml);

// Save
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buf);

console.log('\n✓ Template updated successfully');
console.log('  "Onderzoek scores" → "Onderzoeksscores"');