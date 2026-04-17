import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function inspectCriteriaInTemplate() {
  console.log('Inspecting criteria table in formulieren template...\n');

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

  const xmlContent = doc.asText();

  // Search for criteria codes (like "1.1.1", "1.3.1", etc.)
  console.log('\n=== Searching for WCAG criteria references ===\n');

  // Search for the criteria we're interested in
  const criteriaCodes = ['1.1.1', '1.3.1', '1.3.3', '1.3.5', '2.4.6', '3.3.2', '4.1.2'];

  for (const code of criteriaCodes) {
    const pattern = new RegExp(code.replace(/\./g, '\\.'), 'g');
    const matches = xmlContent.match(pattern);

    if (matches) {
      console.log(`Found ${code}: ${matches.length} occurrence(s)`);

      // Look for context around the first occurrence
      const index = xmlContent.indexOf(code);
      if (index !== -1) {
        const contextStart = Math.max(0, index - 200);
        const contextEnd = Math.min(xmlContent.length, index + 200);
        const context = xmlContent.substring(contextStart, contextEnd);

        // Clean up XML tags for readability
        const cleanContext = context
          .replace(/<w:t[^>]*>/g, '')
          .replace(/<\/w:t>/g, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        console.log(`  Context: "${cleanContext.substring(0, 150)}..."`);
      }
    } else {
      console.log(`Not found: ${code}`);
    }
    console.log();
  }

  // Search for "Voldoet" or "Voldoet niet" text
  console.log('\n=== Searching for status text ===\n');

  const statusTexts = ['Voldoet niet', 'Voldoet', 'Niet aanwezig', 'Niet getoetst'];
  for (const text of statusTexts) {
    const pattern = new RegExp(text, 'gi');
    const matches = xmlContent.match(pattern);
    if (matches) {
      console.log(`Found "${text}": ${matches.length} occurrence(s)`);
    }
  }

  // Look for table structure
  console.log('\n=== Searching for table with criteria ===\n');

  const tablePattern = /<w:tbl>/g;
  const tables = xmlContent.match(tablePattern);
  if (tables) {
    console.log(`Found ${tables.length} table(s) in document`);
  }

  // Look for placeholders related to criteria
  console.log('\n=== Searching for criteria-related placeholders ===\n');

  const placeholders = ['{criteria}', '{criteriaList}', '{assessments}', '{criterionList}'];
  for (const placeholder of placeholders) {
    if (xmlContent.includes(placeholder)) {
      console.log(`Found placeholder: ${placeholder}`);
    }
  }

  console.log('\n=== Done ===\n');
}

inspectCriteriaInTemplate().catch((error) => {
  console.error('Error inspecting template:', error);
  process.exit(1);
});