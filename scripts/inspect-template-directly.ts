import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function inspectTemplateDirectly() {
  console.log('Inspecting template directly...\n');

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

  const criteria = [
    { code: '1.1.1', expected: 'Voldoet', expectedBold: false },
    { code: '1.3.1', expected: 'Voldoet', expectedBold: false },
    { code: '1.3.3', expected: 'Voldoet niet', expectedBold: true },
    { code: '1.3.5', expected: 'Voldoet niet', expectedBold: true },
    { code: '2.4.6', expected: 'Voldoet niet', expectedBold: true },
    { code: '3.3.2', expected: 'Voldoet niet', expectedBold: true },
    { code: '4.1.2', expected: 'Voldoet niet', expectedBold: true },
  ];

  let allCorrect = true;

  for (const criterion of criteria) {
    // Find in table (not TOC)
    let index = xmlContent.indexOf(criterion.code);
    while (index !== -1 && index < 50000) {
      index = xmlContent.indexOf(criterion.code, index + 1);
    }

    if (index === -1 || index < 50000) {
      console.log(`❌ ${criterion.code}: Not found in table`);
      allCorrect = false;
      continue;
    }

    // Get row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index);
    const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;
    const row = xmlContent.substring(trStart, trEnd);

    // Check status
    const hasVoldoetNiet = row.includes('Voldoet niet');
    const hasVoldoet = row.includes('>Voldoet<') || row.includes('<w:t>Voldoet</w:t>');
    const hasBold = row.includes('<w:b/>');

    const actualStatus = hasVoldoetNiet ? 'Voldoet niet' : hasVoldoet ? 'Voldoet' : 'UNKNOWN';
    const statusCorrect = actualStatus === criterion.expected;
    const boldCorrect = hasBold === criterion.expectedBold;

    const symbol = statusCorrect && boldCorrect ? '✓' : '❌';

    console.log(`${symbol} ${criterion.code}:`);
    console.log(`  Status: ${actualStatus} (expected: ${criterion.expected}) ${statusCorrect ? '✓' : '❌'}`);
    console.log(`  Bold: ${hasBold ? 'YES' : 'NO'} (expected: ${criterion.expectedBold ? 'YES' : 'NO'}) ${boldCorrect ? '✓' : '❌'}`);

    if (!statusCorrect || !boldCorrect) {
      allCorrect = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allCorrect) {
    console.log('✅ All criteria are correct!');
  } else {
    console.log('❌ Some criteria need manual fixes');
  }
}

inspectTemplateDirectly().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});