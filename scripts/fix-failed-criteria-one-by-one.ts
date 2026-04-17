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

async function fixFailedCriteria() {
  console.log('Fixing failed criteria one by one...\n');

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'formulieren',
    'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
  );

  if (!validateTemplate(templatePath)) {
    console.error('❌ Current template is invalid!');
    process.exit(1);
  }
  console.log('✓ Starting template is valid\n');

  const criteria = [
    { code: '1.3.3', name: 'Zintuiglijke eigenschappen', from: 'Voldoet', to: 'Voldoet niet' },
    { code: '1.3.5', name: 'Identificeer het doel van de input', from: 'niet</w:t>', to: 'Voldoet niet</w:t>', fromFull: '<w:t>niet</w:t>', special: true },
    { code: '3.3.2', name: 'Labels of instructies', from: 'Voldoet', to: 'Voldoet niet' },
    { code: '4.1.2', name: 'Naam, rol en waarde', from: 'Voldoet', to: 'Voldoet niet' },
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

    let newRow = row;

    // Handle special case for 1.3.5 (niet aanwezig)
    if (criterion.special) {
      // Find and replace the "niet ... aanwezig" pattern
      const nietIndex = row.indexOf('<w:t>niet</w:t>');
      const aanwezigIndex = row.indexOf('aanwezig</w:t>');

      if (nietIndex !== -1 && aanwezigIndex !== -1) {
        const before = row.substring(0, nietIndex);
        const after = row.substring(aanwezigIndex + 'aanwezig</w:t>'.length);
        newRow = before + '<w:t>Voldoet niet</w:t>' + after;
        console.log('  ✓ Changed "niet aanwezig" to "Voldoet niet"');
      }
    } else {
      // Regular replacement: find LAST occurrence of "Voldoet" (status column)
      const lastIndex = row.lastIndexOf('>Voldoet<');
      if (lastIndex !== -1 && !row.includes('Voldoet niet')) {
        newRow = row.substring(0, lastIndex + 1) + 'Voldoet niet<' + row.substring(lastIndex + 8);
        console.log('  ✓ Changed status to "Voldoet niet"');
      } else if (row.includes('Voldoet niet')) {
        console.log('  ⚠ Already "Voldoet niet"');
      }
    }

    // Add bold if needed
    if (!row.includes('<w:b/>')) {
      newRow = newRow.replace(/<w:rPr>/g, '<w:rPr><w:b/><w:bCs/>');
      console.log('  ✓ Added bold formatting');
    } else {
      console.log('  ⚠ Already has bold');
    }

    if (newRow !== row) {
      // Update XML
      xmlContent = xmlContent.substring(0, trStart) + newRow + xmlContent.substring(trEnd);
      zip.file('word/document.xml', xmlContent);

      // Save
      const newContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(templatePath, newContent);

      // Validate
      if (!validateTemplate(templatePath)) {
        console.log('  ❌ Template became invalid!');
        console.log('  This criterion could not be fixed automatically');
        console.log('  Skipping to next...\n');
        // Don't restore, continue with what we have
        continue;
      }

      console.log('  ✓ Changes applied successfully');
    }

    console.log();
  }

  console.log('\n=== Final Validation ===');
  if (validateTemplate(templatePath)) {
    console.log('✓ Template is valid!');

    // Test render
    try {
      const testContent = fs.readFileSync(templatePath, 'binary');
      const testZip = new PizZip(testContent);
      const testDoc = new Docxtemplater(testZip, { paragraphLoop: true, linebreaks: true });

      testDoc.render({
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
        managementSummary: 'Test',
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
      });

      console.log('✓ Template can be rendered!');
    } catch (error) {
      console.log('❌ Template cannot be rendered:', error);
    }
  } else {
    console.log('❌ Template is invalid');
  }
}

fixFailedCriteria().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});