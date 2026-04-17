import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function testDynamicCriteria() {
  console.log('Testing dynamic criteria table generation...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Test data with various criteria
  const testData = {
    projectSubject: 'Test Formulieren Wierden',
    opdrachtgeverNaam: 'Wierden',
    websiteUrl: 'https://www.wierden.nl/',
    reportDate: '1 januari 2026',
    version: '1.0',
    title: 'Toegankelijkheidsonderzoek formulieren Wierden',
    kenmerk: 'TEST-2026',
    standard: 'WCAG 2.2',
    level: 'AA',
    researchType: 'Deelonderzoek formulieren',
    researcherName: 'Test Researcher',
    dateStart: '1 december 2025',
    dateEnd: '15 december 2025',
    auditedByOrg: 'Shift2',
    uniqueForms: 5,
    totalPages: 15,
    totalCriteria: 9,
    passedCriteria: 5,
    failedCriteria: 4,
    percentage: 56,
    compliesFully: 'niet volledig',
    managementSummary: 'Dit is een test samenvatting.',
    researcherFeedback: '',
    aboutResearchText: 'Test onderzoek tekst',
    scopeInfo: 'Test scope info',
    sampleInfo: 'Test sample info',
    conclusionText: 'Test conclusie',
    managementSummaryAdvice: 'Test advies',
    validityText: 'Test geldigheid',
    criteriaCountText: 'Test criteria telling',
    otherCriteriaText: 'Test andere criteria',
    combinedAssessmentText: 'Test gecombineerde beoordeling',
    methodologyText: 'Test methodologie',
    snapshotWarningText: 'Test momentopname waarschuwing',
    continuityAdvice1: 'Test continuïteitsadvies 1',
    continuityAdvice2: 'Test continuïteitsadvies 2',
    scopeExplanation: 'Test scope uitleg',
    methodologyDetailText: 'Test methodologie detail',
    testEnvironmentIntro: 'Test omgeving intro',
    totalFindings: 4,
    totalSampleItems: 15,
    totalScopeUrls: 20,
    browserChrome: 'Google Chrome 145',
    browserFirefox: 'Mozilla Firefox 147',
    browserEdge: 'Microsoft Edge 145',
    screenReader: 'NVDA (Windows)',

    // Dynamic criteria assessments
    criteriaAssessments: [
      { code: '1.1.1', name: 'Niet-tekstuele content', status: 'Voldoet', isFailed: false },
      { code: '1.3.1', name: 'Info en relaties', status: 'Voldoet', isFailed: false },
      { code: '1.3.3', name: 'Zintuiglijke eigenschappen', status: 'Voldoet niet', isFailed: true },
      { code: '1.3.5', name: 'Identificeer het doel van de input', status: 'Voldoet niet', isFailed: true },
      { code: '1.4.1', name: 'Gebruik van kleur', status: 'Voldoet', isFailed: false },
      { code: '1.4.3', name: 'Contrast (minimum)', status: 'Voldoet', isFailed: false },
      { code: '2.4.6', name: 'Koppen en labels', status: 'Voldoet niet', isFailed: true },
      { code: '3.3.2', name: 'Labels of instructies', status: 'Voldoet niet', isFailed: true },
      { code: '4.1.2', name: 'Naam, rol en waarde', status: 'Voldoet', isFailed: false },
    ],
  };

  console.log('Rendering template with test data...');
  console.log(`Criteria in test data: ${testData.criteriaAssessments.length}`);

  try {
    doc.render(testData);

    console.log('✓ Template rendered successfully\n');

    // Generate output
    const outputPath = path.join(process.cwd(), 'test-dynamic-criteria-output.docx');
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Generated test document: ${path.basename(outputPath)}`);
    console.log('\nPlease open this file to verify:');
    console.log('1. The criteria table shows all 9 criteria');
    console.log('2. Failed criteria (1.3.3, 1.3.5, 2.4.6, 3.3.2) should be bold');
    console.log('3. Passed criteria should not be bold');
    console.log('\nNote: Bold formatting needs to be handled separately if needed.');

  } catch (error) {
    console.error('\n❌ Error rendering template:');
    console.error(error);
    process.exit(1);
  }
}

testDynamicCriteria().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});