import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function validateTemplate(filePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    const testDoc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    // Try to render
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

async function fixTextOnly() {
  console.log('Fixing criteria text ONLY (no bold changes)...\n');

  const templatePath = path.join(process.cwd(), 'templates', 'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx');

  const changes = [
    // Passed criteria: change to "Voldoet"
    { code: '1.1.1', name: 'Niet-tekstuele content', from: 'Voldoet niet', to: 'Voldoet' },
    { code: '1.3.1', name: 'Info en relaties', from: 'Voldoet niet', to: 'Voldoet' },
    // Failed criteria: change to "Voldoet niet"
    { code: '1.3.3', name: 'Zintuiglijke eigenschappen', from: '>Voldoet<', to: '>Voldoet niet<' },
    { code: '1.3.5', name: 'Identificeer het doel van de input', special: 'niet-aanwezig' },
    { code: '3.3.2', name: 'Labels of instructies', from: '>Voldoet<', to: '>Voldoet niet<' },
    { code: '4.1.2', name: 'Naam, rol en waarde', from: '>Voldoet<', to: '>Voldoet niet<' },
  ];

  for (const change of changes) {
    console.log(`${change.code} - ${change.name}`);

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = zip.file('word/document.xml');
    if (!doc) continue;

    let xmlContent = doc.asText();

    // Find criterion
    let index = xmlContent.indexOf(change.code);
    while (index !== -1 && index < 50000) {
      index = xmlContent.indexOf(change.code, index + 1);
    }
    if (index === -1) { console.log('  ❌ Not found\n'); continue; }

    // Get row
    const trStart = xmlContent.lastIndexOf('<w:tr ', index);
    const trEnd = xmlContent.indexOf('</w:tr>', index) + 7;
    let row = xmlContent.substring(trStart, trEnd);

    // Apply change
    let newRow = row;
    if (change.special === 'niet-aanwezig') {
      const nietIdx = row.indexOf('<w:t>niet</w:t>');
      const aanwIdx = row.indexOf('aanwezig</w:t>');
      if (nietIdx !== -1 && aanwIdx !== -1) {
        newRow = row.substring(0, nietIdx) + '<w:t>Voldoet niet</w:t>' +
                row.substring(aanwIdx + 'aanwezig</w:t>'.length);
        console.log('  ✓ "niet aanwezig" → "Voldoet niet"');
      }
    } else {
      if (row.includes(change.from!)) {
        newRow = row.replace(change.from!, change.to!);
        console.log(`  ✓ "${change.from}" → "${change.to}"`);
      }
    }

    if (newRow !== row) {
      xmlContent = xmlContent.substring(0, trStart) + newRow + xmlContent.substring(trEnd);
      zip.file('word/document.xml', xmlContent);
      const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(templatePath, newContent);

      if (!validateTemplate(templatePath)) {
        console.log('  ❌ Invalid after change!');
        process.exit(1);
      }
      console.log('  ✓ Valid');
    }
    console.log();
  }

  console.log('✅ All text changes applied successfully!');
  console.log('\n⚠️  Note: Bold formatting must be added manually in Word:');
  console.log('  - Rows with "Voldoet niet" should be bold');
  console.log('  - Rows with "Voldoet" should NOT be bold');
}

fixTextOnly().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});