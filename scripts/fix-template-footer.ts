import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function fixTemplateFooter() {
  console.log('Fixing template footer fields...');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template from:', templatePath);

  // Read the template file
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  // Get the main document XML
  const doc = zip.file('word/document.xml');
  if (!doc) {
    throw new Error('Could not find word/document.xml in template');
  }

  let xmlContent = doc.asText();
  console.log('Template loaded, replacing footer fields...');

  // Count occurrences before replacement
  const patterns = [
    { name: 'A2gemeenten', regex: /A2gemeenten/g },
    { name: '28 februari 2026', regex: /28 februari 2026/g },
    { name: '1.0 (version)', regex: /(?<!\.)\b1\.0\b/g }
  ];

  console.log('\nSearching for hardcoded values:');
  let foundAny = false;
  for (const { name, regex } of patterns) {
    const matches = xmlContent.match(regex);
    if (matches) {
      console.log(`  Found "${name}" - ${matches.length} occurrence(s)`);
      foundAny = true;
    }
  }

  if (!foundAny) {
    console.log('  No hardcoded footer values found');
  }

  console.log('\nApplying replacements:');

  // Replace A2gemeenten with opdrachtgever placeholder
  const a2Count = (xmlContent.match(/A2gemeenten/g) || []).length;
  if (a2Count > 0) {
    console.log(`  Replacing "A2gemeenten" with "{opdrachtgeverNaam}" (${a2Count} occurrences)`);
    xmlContent = xmlContent.replace(/A2gemeenten/g, '{opdrachtgeverNaam}');
  }

  // Replace "28 februari 2026" with date placeholder
  const dateCount = (xmlContent.match(/28 februari 2026/g) || []).length;
  if (dateCount > 0) {
    console.log(`  Replacing "28 februari 2026" with "{reportDate}" (${dateCount} occurrences)`);
    xmlContent = xmlContent.replace(/28 februari 2026/g, '{reportDate}');
  }

  // Replace version "1.0" with version placeholder
  // Be careful to not replace other "1.0" strings
  const versionPattern = /Raportversie:\s*1\.0/gi;
  const versionCount = (xmlContent.match(versionPattern) || []).length;
  if (versionCount > 0) {
    console.log(`  Replacing version "1.0" with "{version}" (${versionCount} occurrences)`);
    xmlContent = xmlContent.replace(versionPattern, 'Raportversie: {version}');
  }

  // Update the document XML
  zip.file('word/document.xml', xmlContent);

  console.log('\nWriting updated template...');

  // Generate the new Word document
  const newContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the new file
  fs.writeFileSync(templatePath, newContent);

  console.log('✓ Template footer updated successfully!');
  console.log('\nPlaceholders added:');
  console.log('  - {opdrachtgeverNaam} for client name');
  console.log('  - {reportDate} for report date');
  console.log('  - {version} for report version');
}

// Run the script
fixTemplateFooter().catch((error) => {
  console.error('Error fixing template footer:', error);
  process.exit(1);
});