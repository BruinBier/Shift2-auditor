import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

async function inspectTestOutput() {
  console.log('Inspecting test-output.docx...\n');

  const testPath = path.join(process.cwd(), 'test-output.docx');

  const content = fs.readFileSync(testPath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  const xmlContent = doc.asText();

  const criteria = [
    '1.1.1', '1.3.1', '1.3.3', '1.3.5', '2.4.6', '3.3.2', '4.1.2'
  ];

  for (const code of criteria) {
    console.log(`\n=== ${code} ===`);

    // Find in table (not TOC)
    let index = xmlContent.indexOf(code);
    while (index !== -1 && index < 50000) {
      index = xmlContent.indexOf(code, index + 1);
    }

    if (index === -1 || index < 50000) {
      console.log('Not found in table');
      continue;
    }

    // Get context
    const start = Math.max(0, index - 100);
    const end = Math.min(xmlContent.length, index + 2000);
    const context = xmlContent.substring(start, end);

    // Look for status
    const hasVoldoetNiet = context.includes('Voldoet niet');
    const hasVoldoet = context.includes('>Voldoet<') && !hasVoldoetNiet;
    const hasNietAanwezig = context.includes('niet</w:t>') && context.includes('aanwezig');
    const hasBold = context.includes('<w:b/>');

    console.log(`Status: ${hasVoldoetNiet ? 'Voldoet niet' : hasVoldoet ? 'Voldoet' : hasNietAanwezig ? 'niet aanwezig' : 'UNKNOWN'}`);
    console.log(`Bold: ${hasBold ? 'YES' : 'NO'}`);
  }
}

inspectTestOutput().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});