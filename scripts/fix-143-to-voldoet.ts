import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function validateTemplate(filePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const testDoc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    testDoc.render({
      projectSubject: 'Test', opdrachtgeverNaam: 'Test', websiteUrl: 'https://test.nl',
      reportDate: '1 jan 2025', version: '1.0', title: 'Test', kenmerk: 'TEST',
      standard: 'WCAG 2.2', level: 'AA', researchType: 'Test', researcherName: 'Test',
      dateStart: '1 jan', dateEnd: '2 jan', auditedByOrg: 'Shift2', uniqueForms: 5,
      totalPages: 10, totalCriteria: 30, passedCriteria: 25, failedCriteria: 5,
      percentage: 83, compliesFully: 'niet volledig', managementSummary: 'Test',
      researcherFeedback: '', aboutResearchText: 'Test', scopeInfo: 'Test',
      sampleInfo: 'Test', conclusionText: 'Test', managementSummaryAdvice: 'Test',
      validityText: 'Test', criteriaCountText: 'Test', otherCriteriaText: 'Test',
      combinedAssessmentText: 'Test', methodologyText: 'Test', snapshotWarningText: 'Test',
      continuityAdvice1: 'Test', continuityAdvice2: 'Test', scopeExplanation: 'Test',
      methodologyDetailText: 'Test', testEnvironmentIntro: 'Test', totalFindings: 0,
      totalSampleItems: 0, totalScopeUrls: 0, browserChrome: 'Chrome',
      browserFirefox: 'Firefox', browserEdge: 'Edge', screenReader: 'NVDA',
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function fix143() {
  console.log('Fixing criterion 1.4.3 to "Voldoet" (not bold)...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Backup first
  const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
  fs.copyFileSync(templatePath, backupPath);
  console.log(`✓ Created backup: ${path.basename(backupPath)}\n`);

  if (!validateTemplate(templatePath)) {
    console.error('❌ Current template is invalid!');
    process.exit(1);
  }

  // Step 1: Change text from "Voldoet niet" to "Voldoet"
  console.log('Step 1: Changing status text from "Voldoet niet" to "Voldoet"...');

  let content = fs.readFileSync(templatePath, 'binary');
  let zip = new PizZip(content);
  let doc = zip.file('word/document.xml');
  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();

  // Find 1.4.3
  let index = xmlContent.indexOf('1.4.3');
  while (index !== -1 && index < 50000) {
    index = xmlContent.indexOf('1.4.3', index + 1);
  }

  if (index === -1) {
    console.error('❌ 1.4.3 not found in table');
    process.exit(1);
  }

  // Get row
  const trStart = xmlContent.lastIndexOf('<w:tr ', index);
  const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;
  let row = xmlContent.substring(trStart, trEnd);

  // Change "Voldoet niet" to "Voldoet"
  let newRow = row.replace('Voldoet niet', 'Voldoet');

  if (newRow === row) {
    console.log('  ⚠ No "Voldoet niet" found to change');
  } else {
    xmlContent = xmlContent.substring(0, trStart) + newRow + xmlContent.substring(trEnd);
    zip.file('word/document.xml', xmlContent);
    const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, newContent);

    if (!validateTemplate(templatePath)) {
      console.error('❌ Template invalid after text change!');
      fs.copyFileSync(backupPath, templatePath);
      process.exit(1);
    }
    console.log('  ✓ Text changed to "Voldoet"');
  }

  // Step 2: Remove bold formatting
  console.log('\nStep 2: Removing bold formatting...');

  content = fs.readFileSync(templatePath, 'binary');
  zip = new PizZip(content);
  doc = zip.file('word/document.xml');
  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  xmlContent = doc.asText();

  // Find 1.4.3 again
  index = xmlContent.indexOf('1.4.3');
  while (index !== -1 && index < 50000) {
    index = xmlContent.indexOf('1.4.3', index + 1);
  }

  if (index === -1) {
    console.error('❌ 1.4.3 not found in table');
    process.exit(1);
  }

  // Get row
  const trStart2 = xmlContent.lastIndexOf('<w:tr ', index);
  const trEnd2 = xmlContent.indexOf('</w:tr>', index) + 7;
  row = xmlContent.substring(trStart2, trEnd2);

  // Remove bold
  newRow = row.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');

  if (newRow === row) {
    console.log('  ⚠ No bold tags found to remove');
  } else {
    xmlContent = xmlContent.substring(0, trStart2) + newRow + xmlContent.substring(trEnd2);
    zip.file('word/document.xml', xmlContent);
    const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, newContent);

    if (!validateTemplate(templatePath)) {
      console.error('❌ Template invalid after removing bold!');
      fs.copyFileSync(backupPath, templatePath);
      process.exit(1);
    }
    console.log('  ✓ Bold formatting removed');
  }

  console.log('\n✅ Criterion 1.4.3 fixed successfully!');
  console.log('   Status: Voldoet (not bold)');
}

fix143().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});