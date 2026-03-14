import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

async function validateTemplate() {
  console.log('Validating Word template...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  console.log('Reading template from:', templatePath);

  try {
    // Read the template file
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    console.log('✓ Template ZIP structure is valid');

    // Check for required files
    const requiredFiles = ['word/document.xml', '_rels/.rels', '[Content_Types].xml'];

    for (const file of requiredFiles) {
      const fileContent = zip.file(file);
      if (!fileContent) {
        console.log(`❌ Missing required file: ${file}`);
      } else {
        console.log(`✓ Found: ${file}`);
      }
    }

    // Try to create a Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    console.log('✓ Docxtemplater can parse the template');

    // Try to render with minimal test data
    const testData = {
      projectSubject: 'Test',
      opdrachtgeverNaam: 'Test',
      websiteUrl: 'https://test.nl',
      reportDate: '1 januari 2025',
      version: '1.0',
      title: 'Test',
      kenmerk: 'TEST',
      standard: 'WCAG 2.2',
      level: 'AA',
      researchType: 'Test',
      researcherName: 'Test',
      dateStart: '1 januari 2025',
      dateEnd: '2 januari 2025',
      auditedByOrg: 'Shift2',
      uniqueForms: 5,
      totalPages: 10,
      totalCriteria: 30,
      passedCriteria: 25,
      failedCriteria: 5,
      percentage: 83,
      compliesFully: 'niet volledig',
      managementSummary: 'Test summary',
      researcherFeedback: '',
      aboutResearchText: 'Test',
      scopeInfo: 'Test',
      sampleInfo: 'Test',
      conclusionText: 'Test',
      managementSummaryAdvice: 'Test',
      validityText: 'Test',
      criteriaCountText: 'Test',
      otherCriteriaText: 'Test',
      combinedAssessmentText: 'Test',
      methodologyText: 'Test',
      snapshotWarningText: 'Test',
      continuityAdvice1: 'Test',
      continuityAdvice2: 'Test',
      scopeExplanation: 'Test',
      methodologyDetailText: 'Test',
      testEnvironmentIntro: 'Test',
      totalFindings: 0,
      totalSampleItems: 0,
      totalScopeUrls: 0,
      browserChrome: 'Chrome',
      browserFirefox: 'Firefox',
      browserEdge: 'Edge',
      screenReader: 'NVDA',
    };

    doc.render(testData);

    console.log('✓ Template renders successfully with test data');

    // Try to generate the output
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    console.log('✓ Can generate DOCX buffer');
    console.log(`  Buffer size: ${buffer.length} bytes`);

    // Write test output
    const testOutputPath = path.join(process.cwd(), 'test-output.docx');
    fs.writeFileSync(testOutputPath, buffer);

    console.log(`✓ Test document written to: ${testOutputPath}`);

    console.log('\n✅ Template validation PASSED!');
    console.log('The template is valid and can be used for document generation.');

  } catch (error) {
    console.error('\n❌ Template validation FAILED!');
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }

    process.exit(1);
  }
}

validateTemplate().catch((error) => {
  console.error('Error validating template:', error);
  process.exit(1);
});