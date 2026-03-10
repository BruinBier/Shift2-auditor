import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function updateFormulierenTemplate() {
  console.log('Starting to update formulieren template...');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template.docx'
  );

  const outputPath = path.join(
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
  console.log('Template loaded, replacing text with placeholders...');

  // Define replacements - these are the texts to find and replace with placeholders
  const replacements: Record<string, string> = {
    // Summary section - replace specific numbers with placeholders
    // Match patterns like "9 gepubliceerde formulieren" or "7 gepubliceerde formulieren"
    // We need to be careful with the regex to match the full sentence

    // First, let's replace the date pattern
    '9 maart 2026': '{dateStart}',
    '23 maart 2026': '{dateEnd}',

    // Replace the forms count pattern - this is tricky because it varies
    // We'll look for patterns like "X gepubliceerde formulieren" or "X formulieren met in het totaal Y pagina's/processtappen"
  };

  // More complex replacements that need regex
  const regexReplacements: Array<{ pattern: RegExp; replacement: string }> = [
    // Replace "X formulieren met in het totaal Y processtappen" pattern
    {
      pattern: /(\d+)\s+formulieren\s+met\s+in\s+het\s+totaal\s+(\d+)\s+(processtappen|pagina's)/gi,
      replacement: '{uniqueForms} formulieren met in het totaal {totalPages} processtappen'
    },
    // Replace "X gepubliceerde formulieren" pattern (older format)
    {
      pattern: /(\d+)\s+gepubliceerde\s+formulieren/gi,
      replacement: '{uniqueForms} formulieren met in het totaal {totalPages} processtappen'
    },
    // Replace criteria counts
    {
      pattern: /(\d+)\s+succescriteria\s+beoordeeld/gi,
      replacement: '{totalCriteria} succescriteria beoordeeld'
    },
    {
      pattern: /Er\s+wordt\s+voldaan\s+aan\s+(\d+)\s+van\s+deze\s+(\d+)\s+succescriteria\s+\((\d+)%\)/gi,
      replacement: 'Er wordt voldaan aan {passedCriteria} van deze {totalCriteria} succescriteria ({percentage}%)'
    },
    {
      pattern: /Bij\s+(\d+)\s+succescriteria\s+zijn\s+afwijkingen\s+vastgesteld/gi,
      replacement: 'Bij {failedCriteria} succescriteria zijn afwijkingen vastgesteld'
    },
    // Replace compliance text
    {
      pattern: /voldoet\s+(niet\s+volledig|volledig)\s+aan\s+WCAG/gi,
      replacement: 'voldoet {compliesFully} aan WCAG'
    },
    // Add researcher feedback placeholder after the second paragraph (after "Bij {failedCriteria}...")
    // We'll insert {researcherFeedback} as a new paragraph
    {
      pattern: /(Bij\s+\{failedCriteria\}\s+succescriteria\s+zijn\s+afwijkingen\s+vastgesteld\.)/gi,
      replacement: '$1\n\n{researcherFeedback}\n'
    },
  ];

  // Apply simple replacements
  for (const [find, replace] of Object.entries(replacements)) {
    const count = (xmlContent.match(new RegExp(find, 'g')) || []).length;
    if (count > 0) {
      console.log(`  Replacing "${find}" with "${replace}" (${count} occurrences)`);
      xmlContent = xmlContent.replace(new RegExp(find, 'g'), replace);
    }
  }

  // Apply regex replacements
  for (const { pattern, replacement } of regexReplacements) {
    const matches = xmlContent.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`  Replacing pattern "${pattern}" with "${replacement}" (${matches.length} occurrences)`);
      console.log(`    Matched: "${matches[0]}"`);
      xmlContent = xmlContent.replace(pattern, replacement);
    }
  }

  // Update the document XML
  zip.file('word/document.xml', xmlContent);

  console.log('Writing updated template to:', outputPath);

  // Generate the new Word document
  const newContent = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  // Write the new file
  fs.writeFileSync(outputPath, newContent);

  console.log('✓ Template updated successfully!');
  console.log('\nPlaceholders added:');
  console.log('  - {dateStart} and {dateEnd} for dates');
  console.log('  - {uniqueForms} for number of unique forms');
  console.log('  - {totalPages} for total processtappen');
  console.log('  - {totalCriteria} for total criteria assessed');
  console.log('  - {passedCriteria} for criteria passed');
  console.log('  - {failedCriteria} for criteria failed');
  console.log('  - {percentage} for pass percentage');
  console.log('  - {compliesFully} for compliance level');
}

// Run the script
updateFormulierenTemplate().catch((error) => {
  console.error('Error updating template:', error);
  process.exit(1);
});