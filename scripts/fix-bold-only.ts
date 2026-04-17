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

async function fixBoldOnly() {
  console.log('Fixing bold formatting ONLY...\n');

  const templatePath = path.join(process.cwd(), 'templates', 'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx');

  if (!validateTemplate(templatePath)) {
    console.error('❌ Current template is invalid!');
    process.exit(1);
  }
  console.log('✓ Template is valid\n');

  // Criteria that should NOT be bold (passed)
  const removeBold = [
    { code: '1.1.1', name: 'Niet-tekstuele content' },
    { code: '1.3.1', name: 'Info en relaties' },
  ];

  for (const criterion of removeBold) {
    console.log(`${criterion.code} - ${criterion.name} (removing bold)`);

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

    // Remove bold
    const newRow = row.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');

    if (newRow !== row) {
      xmlContent = xmlContent.substring(0, trStart) + newRow + xmlContent.substring(trEnd);
      zip.file('word/document.xml', xmlContent);
      const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(templatePath, newContent);

      if (!validateTemplate(templatePath)) {
        console.log('  ❌ Invalid after removing bold!');
        console.log('  Skipping this criterion');
        // Restore
        fs.copyFileSync(templatePath.replace('.docx', '-before-bold.docx'), templatePath);
      } else {
        console.log('  ✓ Bold removed');
      }
    }
    console.log();
  }

  console.log('\n✅ Done! Template status:');
  if (validateTemplate(templatePath)) {
    console.log('✓ Template is valid and can be used\n');
  } else {
    console.log('❌ Template has issues\n');
  }

  console.log('Note: Failed criteria (1.3.3, 1.3.5, 2.4.6, 3.3.2, 4.1.2) still need bold added manually');
}

fixBoldOnly().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});