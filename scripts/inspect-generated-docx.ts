import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function inspectGeneratedDocx() {
  console.log('Inspecting generated DOCX...\n');

  const docxPath = path.join(process.cwd(), 'test-dynamic-criteria-output.docx');

  if (!fs.existsSync(docxPath)) {
    console.error('File not found:', docxPath);
    return;
  }

  const content = fs.readFileSync(docxPath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  const xmlContent = doc.asText();

  // Check for criteria codes
  const criteriaCodes = ['1.1.1', '1.3.1', '1.3.3', '1.3.5', '1.4.1', '1.4.3', '2.4.6', '3.3.2', '4.1.2'];
  const foundCriteria: string[] = [];

  console.log('Checking for criteria in document:\n');

  for (const code of criteriaCodes) {
    // Find all occurrences
    const regex = new RegExp(code.replace(/\./g, '\\.'), 'g');
    const matches = xmlContent.match(regex);

    if (matches && matches.length > 1) {
      // More than 1 means it's in TOC + in table
      foundCriteria.push(code);
      console.log(`✓ ${code} found`);
    } else if (matches && matches.length === 1) {
      console.log(`⚠ ${code} found only once (maybe only in TOC?)`);
    } else {
      console.log(`❌ ${code} NOT found`);
    }
  }

  console.log(`\n✅ Found ${foundCriteria.length} out of ${criteriaCodes.length} criteria in the table`);

  // Check for "Voldoet" and "Voldoet niet" status texts
  const voldoetMatches = xmlContent.match(/>Voldoet</g);
  const voldoetNietMatches = xmlContent.match(/Voldoet niet/g);

  console.log(`\nStatus texts:`);
  console.log(`  "Voldoet": ${voldoetMatches ? voldoetMatches.length : 0} occurrences`);
  console.log(`  "Voldoet niet": ${voldoetNietMatches ? voldoetNietMatches.length : 0} occurrences`);

  // Check if loop markers are still present (they shouldn't be)
  if (xmlContent.includes('{#criteriaAssessments}') || xmlContent.includes('{/criteriaAssessments}')) {
    console.log('\n⚠ WARNING: Loop markers still present in document! This means the loop did not execute.');
  } else {
    console.log('\n✓ Loop markers were properly processed');
  }

  // Check for criteria names
  const criteriaNames = [
    'Niet-tekstuele content',
    'Info en relaties',
    'Zintuiglijke eigenschappen',
    'Identificeer het doel van de input',
    'Gebruik van kleur',
    'Contrast (minimum)',
    'Koppen en labels',
    'Labels of instructies',
    'Naam, rol en waarde'
  ];

  console.log('\nChecking for criteria names:');
  let namesFound = 0;
  for (const name of criteriaNames) {
    if (xmlContent.includes(name)) {
      namesFound++;
      console.log(`✓ "${name}"`);
    } else {
      console.log(`❌ "${name}" NOT found`);
    }
  }

  console.log(`\n✅ Found ${namesFound} out of ${criteriaNames.length} criteria names`);

  if (foundCriteria.length === criteriaCodes.length && namesFound === criteriaNames.length) {
    console.log('\n🎉 SUCCESS: Dynamic criteria table is working correctly!');
  } else {
    console.log('\n⚠ WARNING: Some criteria or names are missing. The loop may not have worked correctly.');
  }
}

inspectGeneratedDocx().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});