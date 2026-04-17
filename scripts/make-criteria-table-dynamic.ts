import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

/**
 * This script replaces the hardcoded criteria rows with a Docxtemplater loop.
 * It uses the "paragraphLoop" feature which works better with Word tables.
 */

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
      criteriaAssessments: [
        { code: '1.1.1', name: 'Test', status: 'Voldoet', isFailed: false }
      ],
    });
    return true;
  } catch (error) {
    console.error('Validation error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function makeCriteriaTableDynamic() {
  console.log('Making criteria table dynamic...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  // Backup
  const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
  fs.copyFileSync(templatePath, backupPath);
  console.log(`✓ Created backup: ${path.basename(backupPath)}\n`);

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');

  if (!doc) {
    throw new Error('Could not find word/document.xml');
  }

  let xmlContent = doc.asText();

  // Find the criteria table
  const criterion111Index = xmlContent.indexOf('1.1.1', xmlContent.indexOf('1.1.1') + 1);
  const tableStart = xmlContent.lastIndexOf('<w:tbl', criterion111Index);
  const tableEnd = xmlContent.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length;

  const table = xmlContent.substring(tableStart, tableEnd);

  // Get header row (first row)
  const firstRowStart = table.indexOf('<w:tr');
  const firstRowEnd = table.indexOf('</w:tr>', firstRowStart) + '</w:tr>'.length;
  const headerRow = table.substring(firstRowStart, firstRowEnd);

  // Get second row as template (this is the 1.1.1 row)
  const secondRowStart = table.indexOf('<w:tr', firstRowEnd);
  const secondRowEnd = table.indexOf('</w:tr>', secondRowStart) + '</w:tr>'.length;
  let templateRow = table.substring(secondRowStart, secondRowEnd);

  console.log('Creating template row...');

  // Replace criterion details with placeholders
  // Column 1: Code + Name
  templateRow = templateRow.replace('1.1.1 Niet-tekstuele content', '{code} {name}');

  // Handle separate occurrences
  templateRow = templateRow.replace('1.1.1', '{code}');
  templateRow = templateRow.replace('Niet-tekstuele content', '{name}');

  // Column 2: Level (keep as "A")
  // No change needed

  // Column 3: Status
  // Replace "Voldoet" or "Voldoet niet" with {status}
  templateRow = templateRow.replace(/<w:t>Voldoet niet<\/w:t>/g, '<w:t>{status}</w:t>');
  templateRow = templateRow.replace(/<w:t>Voldoet<\/w:t>/g, '<w:t>{status}</w:t>');

  // Remove all bold tags - we'll handle bold separately
  templateRow = templateRow.replace(/<w:b\/>/g, '').replace(/<w:bCs\/>/g, '');

  console.log('✓ Template row created with placeholders\n');

  // Build new table with loop
  // The loop markers need to be in separate paragraphs BEFORE and AFTER the row
  const tablePrefix = table.substring(0, firstRowStart);

  // Create loop start marker as a paragraph
  const loopStart = '{#criteriaAssessments}';
  const loopEnd = '{/criteriaAssessments}';

  // Insert loop markers around the template row
  const newTableContent = tablePrefix +
    headerRow +
    loopStart +
    templateRow +
    loopEnd +
    '</w:tbl>';

  // Replace the old table with the new one
  const newXml = xmlContent.substring(0, tableStart) +
    newTableContent +
    xmlContent.substring(tableEnd);

  // Save
  zip.file('word/document.xml', newXml);
  const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, newContent);

  console.log('Testing template with validation...');

  if (!validateTemplate(templatePath)) {
    console.error('\n❌ Template is invalid! Restoring backup...');
    fs.copyFileSync(backupPath, templatePath);
    console.error('Template has been restored to original state.');
    console.error('\nThe table loop syntax may need to be added manually in Word.');
    process.exit(1);
  }

  console.log('\n✅ Template updated successfully!');
  console.log('The criteria table will now be generated dynamically from project data.');
}

makeCriteriaTableDynamic().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});