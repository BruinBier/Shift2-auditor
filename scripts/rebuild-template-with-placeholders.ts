import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function rebuildTemplateWithPlaceholders() {
  console.log('Rebuilding template with all placeholders...\n');

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
  console.log('Template loaded\n');

  // Step 1: Replace hardcoded client name
  console.log('Step 1: Replacing hardcoded client names...');
  xmlContent = xmlContent.replace(/Valkenswaard/g, '{opdrachtgeverNaam}');
  xmlContent = xmlContent.replace(/A2gemeenten/g, '{opdrachtgeverNaam}');
  console.log('  ✓ Replaced client names with {opdrachtgeverNaam}');

  // Step 2: Replace hardcoded URLs
  console.log('\nStep 2: Replacing hardcoded URLs...');
  xmlContent = xmlContent.replace(/https:\/\/www\.valkenswaard\.nl\/?/gi, '{websiteUrl}');
  xmlContent = xmlContent.replace(/www\.valkenswaard\.nl/gi, '{websiteUrl}');
  console.log('  ✓ Replaced URLs with {websiteUrl}');

  // Step 3: Replace dates and version
  console.log('\nStep 3: Replacing dates and version...');
  xmlContent = xmlContent.replace(/28 februari 2026/g, '{reportDate}');
  xmlContent = xmlContent.replace(/Rapportversie:\s*1\.0/gi, 'Rapportversie: {version}');
  console.log('  ✓ Replaced dates with {reportDate} and version with {version}');

  // Step 4: Replace "website" with "formulieren" in title
  console.log('\nStep 4: Fixing title...');
  xmlContent = xmlContent.replace(/Toegankelijkheidsonderzoek\s+website/gi, 'Toegankelijkheidsonderzoek formulieren');
  console.log('  ✓ Replaced "website" with "formulieren"');

  // Step 5: Replace the summary section with {managementSummary} placeholder
  console.log('\nStep 5: Adding {managementSummary} placeholder...');

  // Find the summary section - it starts with "Dit onderzoek is door Shift2" and ends with "afwijkingen vastgesteld."
  // We want to replace EVERYTHING including any "Wij adviseren om" text with a single {managementSummary} placeholder

  const summaryStartPattern = /Dit onderzoek is door Shift2 uitgevoerd tussen/i;
  const summaryEndPattern = /afwijkingen vastgesteld\./i;

  // Also look for the "Wij adviseren" ending
  const adviceEndPattern = /Wij adviseren om (formulier)?content periodiek te controleren.*?publicatieproces( van formulieren)?\./is;

  const startMatch = xmlContent.search(summaryStartPattern);

  if (startMatch !== -1) {
    // Try to find the end with advice text first
    const textAfterStart = xmlContent.substring(startMatch);
    const adviceMatch = textAfterStart.search(adviceEndPattern);

    let endMatch = -1;
    let endLength = 0;

    if (adviceMatch !== -1) {
      // Found advice text, use that as end
      const fullAdviceMatch = textAfterStart.match(adviceEndPattern);
      if (fullAdviceMatch) {
        endMatch = startMatch + adviceMatch + fullAdviceMatch[0].length;
        console.log('  Found summary with advice text');
      }
    } else {
      // No advice text, use "afwijkingen vastgesteld." as end
      const endSearch = textAfterStart.search(summaryEndPattern);
      if (endSearch !== -1) {
        endMatch = startMatch + endSearch + 'afwijkingen vastgesteld.'.length;
        console.log('  Found summary without advice text');
      }
    }

    if (endMatch !== -1) {
      const before = xmlContent.substring(0, startMatch);
      const after = xmlContent.substring(endMatch);

      xmlContent = before + '{managementSummary}' + after;
      console.log('  ✓ Replaced summary section with {managementSummary}');
    } else {
      console.log('  ⚠ Could not find end of summary section');
    }
  } else {
    console.log('  ⚠ Could not find start of summary section');
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

  console.log('✓ Template rebuilt successfully!\n');
  console.log('Placeholders added:');
  console.log('  - {opdrachtgeverNaam}');
  console.log('  - {websiteUrl}');
  console.log('  - {reportDate}');
  console.log('  - {version}');
  console.log('  - {managementSummary}');
}

// Run the script
rebuildTemplateWithPlaceholders().catch((error) => {
  console.error('Error rebuilding template:', error);
  process.exit(1);
});