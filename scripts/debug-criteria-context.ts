import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function debugCriteriaContext() {
  console.log('Debugging criteria context in formulieren template...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  const xmlContent = doc.asText();

  // Find all occurrences of 1.1.1
  console.log('=== Occurrences of 1.1.1 ===\n');
  let index = 0;
  let count = 0;

  while ((index = xmlContent.indexOf('1.1.1', index)) !== -1) {
    count++;
    const start = Math.max(0, index - 500);
    const end = Math.min(xmlContent.length, index + 1500);
    const context = xmlContent.substring(start, end);

    console.log(`\n--- Occurrence ${count} at position ${index} ---`);
    console.log(context);
    console.log('\n');

    index++;
  }

  // Find all occurrences of 1.3.1
  console.log('\n\n=== Occurrences of 1.3.1 ===\n');
  index = 0;
  count = 0;

  while ((index = xmlContent.indexOf('1.3.1', index)) !== -1) {
    count++;
    const start = Math.max(0, index - 500);
    const end = Math.min(xmlContent.length, index + 1500);
    const context = xmlContent.substring(start, end);

    console.log(`\n--- Occurrence ${count} at position ${index} ---`);
    console.log(context);
    console.log('\n');

    index++;
  }

  // Write to file for easier analysis
  const output = {
    '1.1.1_occurrences': [] as any[],
    '1.3.1_occurrences': [] as any[],
  };

  index = 0;
  while ((index = xmlContent.indexOf('1.1.1', index)) !== -1) {
    const start = Math.max(0, index - 500);
    const end = Math.min(xmlContent.length, index + 1500);
    output['1.1.1_occurrences'].push({
      position: index,
      context: xmlContent.substring(start, end),
    });
    index++;
  }

  index = 0;
  while ((index = xmlContent.indexOf('1.3.1', index)) !== -1) {
    const start = Math.max(0, index - 500);
    const end = Math.min(xmlContent.length, index + 1500);
    output['1.3.1_occurrences'].push({
      position: index,
      context: xmlContent.substring(start, end),
    });
    index++;
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'criteria-context-debug.json'),
    JSON.stringify(output, null, 2)
  );

  console.log('\nWritten debug output to criteria-context-debug.json');
}

debugCriteriaContext().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});