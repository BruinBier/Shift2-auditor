import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function validateTemplate(filePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    return true;
  } catch (error) {
    return false;
  }
}

async function fixOneByOne() {
  console.log('Fixing template one criterion at a time...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Start fresh from backup
  const backupPath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders - BACKUP-20260310-213334.docx'
  );

  console.log('Starting from backup...');
  fs.copyFileSync(backupPath, templatePath);

  if (!validateTemplate(templatePath)) {
    console.error('❌ Backup template is invalid!');
    process.exit(1);
  }
  console.log('✓ Backup template is valid\n');

  const criteria = [
    { code: '1.1.1', name: 'Niet-tekstuele content', from: 'Voldoet niet', to: 'Voldoet', removeBold: true },
    { code: '1.3.1', name: 'Info en relaties', from: 'Voldoet niet', to: 'Voldoet', removeBold: true },
  ];

  for (const criterion of criteria) {
    console.log(`Processing ${criterion.code} - ${criterion.name}...`);

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = zip.file('word/document.xml');

    if (!doc) {
      console.error('  ❌ Could not find document.xml');
      continue;
    }

    let xmlContent = doc.asText();

    // Find the criterion (skip TOC)
    let index = xmlContent.indexOf(criterion.code);
    while (index !== -1 && index < 50000) {
      index = xmlContent.indexOf(criterion.code, index + 1);
    }

    if (index === -1) {
      console.log('  ❌ Not found in table');
      continue;
    }

    // Get table row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index);
    const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;
    let row = xmlContent.substring(trStart, trEnd);

    // ONLY change status text, nothing else
    if (row.includes(criterion.from)) {
      const newRow = row.replace(new RegExp(criterion.from, 'g'), criterion.to);

      // Update XML
      xmlContent = xmlContent.substring(0, trStart) + newRow + xmlContent.substring(trEnd);
      zip.file('word/document.xml', xmlContent);

      // Save
      const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(templatePath, newContent);

      // Validate
      if (!validateTemplate(templatePath)) {
        console.log('  ❌ Template became invalid after text change!');
        console.log('  Restoring backup...');
        fs.copyFileSync(backupPath, templatePath);
        break;
      }

      console.log('  ✓ Status changed successfully');
    }

    // Now try to remove bold (separately)
    if (criterion.removeBold) {
      const content2 = fs.readFileSync(templatePath, 'binary');
      const zip2 = new PizZip(content2);
      const doc2 = zip2.file('word/document.xml');

      if (!doc2) continue;

      let xmlContent2 = doc2.asText();

      // Find row again
      let index2 = xmlContent2.indexOf(criterion.code);
      while (index2 !== -1 && index2 < 50000) {
        index2 = xmlContent2.indexOf(criterion.code, index2 + 1);
      }

      if (index2 === -1) continue;

      const trStart2 = xmlContent2.lastIndexOf('<w:tr ', index2);
      const trEnd2 = xmlContent2.indexOf('</w:tr>', index2) + 7;
      let row2 = xmlContent2.substring(trStart2, trEnd2);

      // Remove bold tags
      const newRow2 = row2.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');

      xmlContent2 = xmlContent2.substring(0, trStart2) + newRow2 + xmlContent2.substring(trEnd2);
      zip2.file('word/document.xml', xmlContent2);

      const newContent2 = zip2.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(templatePath, newContent2);

      if (!validateTemplate(templatePath)) {
        console.log('  ❌ Template became invalid after removing bold!');
        console.log('  Restoring previous state...');
        // Restore the version with just text changed
        const content3 = fs.readFileSync(backupPath, 'binary');
        const zip3 = new PizZip(content3);
        const doc3 = zip3.file('word/document.xml');
        let xmlContent3 = doc3!.asText();
        let index3 = xmlContent3.indexOf(criterion.code);
        while (index3 !== -1 && index3 < 50000) {
          index3 = xmlContent3.indexOf(criterion.code, index3 + 1);
        }
        const trStart3 = xmlContent3.lastIndexOf('<w:tr ', index3);
        const trEnd3 = xmlContent3.indexOf('</w:tr>', index3) + 7;
        let row3 = xmlContent3.substring(trStart3, trEnd3);
        const newRow3 = row3.replace(new RegExp(criterion.from, 'g'), criterion.to);
        xmlContent3 = xmlContent3.substring(0, trStart3) + newRow3 + xmlContent3.substring(trEnd3);
        zip3.file('word/document.xml', xmlContent3);
        const newContent3 = zip3.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fs.writeFileSync(templatePath, newContent3);
      } else {
        console.log('  ✓ Bold removed successfully');
      }
    }

    console.log();
  }

  console.log('\n=== Final Validation ===');
  if (validateTemplate(templatePath)) {
    console.log('✓ Template is valid!');
  } else {
    console.log('❌ Template is invalid');
  }
}

fixOneByOne().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});