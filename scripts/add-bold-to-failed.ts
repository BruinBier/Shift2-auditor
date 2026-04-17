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
    console.error('Validation error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function addBoldToFailed() {
  console.log('Adding bold to failed criteria...\n');

  const templatePath = path.join(process.cwd(), 'templates', 'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx');

  // Backup first
  const backupPath = templatePath.replace('.docx', `-backup-before-bold-${Date.now()}.docx`);
  fs.copyFileSync(templatePath, backupPath);
  console.log(`Created backup: ${path.basename(backupPath)}\n`);

  if (!validateTemplate(templatePath)) {
    console.error('❌ Current template is invalid!');
    process.exit(1);
  }
  console.log('✓ Template is valid\n');

  // Criteria that need bold
  const addBold = [
    { code: '1.3.3', name: 'Zintuiglijke eigenschappen' },
    { code: '1.3.5', name: 'Identificeer het doel van de input' },
    { code: '3.3.2', name: 'Labels of instructies' },
    { code: '4.1.2', name: 'Naam, rol en waarde' },
  ];

  for (const criterion of addBold) {
    console.log(`${criterion.code} - ${criterion.name}`);

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = zip.file('word/document.xml');
    if (!doc) continue;

    let xmlContent = doc.asText();

    // Find criterion
    let index = xmlContent.indexOf(criterion.code);
    while (index !== -1 && index < 50000) {
      index = xmlContent.indexOf(criterion.code, index + 1);
    }
    if (index === -1) { console.log('  ❌ Not found\n'); continue; }

    // Get row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index);
    const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;
    let row = xmlContent.substring(trStart, trEnd);

    // Check if already bold
    if (row.includes('<w:b/>')) {
      console.log('  ⚠ Already bold\n');
      continue;
    }

    // Add bold tags
    const newRow = row.replace(/<w:rPr>/g, '<w:rPr><w:b/><w:bCs/>');

    xmlContent = xmlContent.substring(0, trStart) + newRow + xmlContent.substring(trEnd);
    zip.file('word/document.xml', xmlContent);
    const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, newContent);

    if (!validateTemplate(templatePath)) {
      console.log('  ❌ Invalid after adding bold!');
      console.log('  Restoring backup...');
      fs.copyFileSync(backupPath, templatePath);
      console.log('  This criterion needs manual bold formatting in Word\n');
      break; // Stop trying
    } else {
      console.log('  ✓ Bold added\n');
    }
  }

  console.log('Final validation...');
  if (validateTemplate(templatePath)) {
    console.log('✅ Template is valid!\n');
  } else {
    console.log('❌ Template is invalid\n');
  }
}

addBoldToFailed().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});