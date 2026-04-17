import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

console.log('=== Generating test report to verify TOC ===\n');

// Load the template
const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

const templateContent = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(templateContent);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

console.log('Template loaded, rendering with test data...');

// Minimal test data
const testData = {
  projectSubject: 'Test Formulieren',
  opdrachtgeverNaam: 'Test Gemeente',
  websiteUrl: 'https://www.test.nl/',
  reportDate: '12 maart 2026',
  version: '1',
  title: 'Toegankelijkheidsonderzoek Test',
  kenmerk: 'TEST-001',
  standard: 'WCAG 2.2',
  level: 'AA',
  researchType: 'Formulieren',
  researcherName: 'Test Onderzoeker',
  dateStart: '1 maart 2026',
  dateEnd: '10 maart 2026',
  auditedByOrg: 'Shift2',
  uniqueForms: 5,
  totalPages: 10,
  totalCriteria: 50,
  passedCriteria: 45,
  failedCriteria: 5,
  percentage: 90,
  compliesFully: 'niet volledig',
  managementSummary: 'Dit is een test samenvatting om de inhoudsopgave te verifiëren.',
  researcherFeedback: '',
  aboutResearchText: 'Test onderzoek tekst.',
  scopeInfo: 'Test scope info.',
  sampleInfo: 'Test steekproef info.',
  conclusionText: 'Test conclusie.',
  managementSummaryAdvice: 'Test advies.',
  validityText: 'Test geldigheid.',
  criteriaCountText: 'Test criteria telling.',
  otherCriteriaText: 'Test andere criteria.',
  combinedAssessmentText: 'Test gecombineerde beoordeling.',
  methodologyText: 'Test methodologie.',
  snapshotWarningText: 'Test waarschuwing.',
  continuityAdvice1: 'Test continuïteit advies 1.',
  continuityAdvice2: 'Test continuïteit advies 2.',
  scopeExplanation: 'Test scope uitleg.',
  methodologyDetailText: 'Test methodologie detail.',
  testEnvironmentIntro: 'Test omgeving intro.',
  totalFindings: 5,
  totalSampleItems: 10,
  totalScopeUrls: 15,
  browserChrome: 'Google Chrome 145',
  browserFirefox: 'Mozilla Firefox 147',
  browserEdge: 'Microsoft Edge 145',
  screenReader: 'NVDA (Windows)',
  criteriaAssessments: [
    { code: '1.1.1', name: 'Niet-tekstuele content', status: 'Voldoet', isFailed: false },
    { code: '1.4.3', name: 'Contrast (minimum)', status: 'Voldoet niet', isFailed: true },
  ],
};

// Render the template
doc.render(testData);

console.log('Template rendered, generating DOCX...');

// Generate the Word document
const docxBuffer = doc.getZip().generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',
});

// Save to file
const outputPath = path.join(process.cwd(), 'test-toc-output.docx');
fs.writeFileSync(outputPath, docxBuffer);

console.log(`\n✓ Test report generated: ${outputPath}`);
console.log('\nOpen this file in Word to verify:');
console.log('1. The TOC does NOT contain "Toegankelijkheidsonderzoek formulieren Test Gemeente"');
console.log('2. The TOC does NOT contain "Inhoud"');
console.log('3. The TOC starts with "Samenvatting"');
console.log('\nYou can also right-click the TOC and select "Update Field" to see if it regenerates correctly.');