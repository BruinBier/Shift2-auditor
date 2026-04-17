import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

/**
 * Ultra-conservative approach: Only change text content, do NOT modify XML structure
 */
async function fixTemplateUltraConservative() {
  console.log('Fixing template with ultra-conservative approach...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Backup
  const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
  fs.copyFileSync(templatePath, backupPath);
  console.log(`✓ Created backup\n`);

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();
  const originalLength = xmlContent.length;

  console.log('Making minimal text replacements...\n');

  // Strategy: Use very specific context-aware replacements
  // We'll look for the exact pattern in the table and replace ONLY the status text

  // For 1.1.1: Find the pattern where we have "1.1.1 Niet-tekstuele content" followed by level "A" and then "Voldoet niet"
  // Replace that specific "Voldoet niet" with just removing " niet"

  // Pattern: Find table cells with criterion code, then find status in same row
  // We need to be VERY specific to avoid changing things outside the table

  const fixes = [
    // For criteria that should be "Voldoet" (passed):
    // Find the bold "Voldoet niet" and make it just "Voldoet" without removing bold tags
    {
      // 1.1.1 - remove bold tags from entire row FIRST, then change text
      search: '<w:t>1.1.1 Niet-tekstuele content</w:t>',
      action: 'Make this row non-bold and status Voldoet'
    },
    {
      search: '<w:t>1.3.1 Info en relaties</w:t>',
      action: 'Make this row non-bold and status Voldoet'
    },
  ];

  // Actually, this is getting too complex. Let me try a DIFFERENT approach:
  // Open the template in Word using an external tool, or...
  // Use a library that can handle Word documents at a higher level

  console.log('This approach is too risky for automated changes.');
  console.log('The Word document has a complex XML structure that is easily corrupted.');
  console.log('\nRecommendation: Make changes manually in Microsoft Word');

  fs.unlinkSync(backupPath);
}

fixTemplateUltraConservative().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});