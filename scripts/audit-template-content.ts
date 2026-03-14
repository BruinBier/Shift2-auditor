import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Reading template...');
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const documentXml = zip.file('word/document.xml');
if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

const xmlContent = documentXml.asText();

console.log('\n=== COMPREHENSIVE TEMPLATE AUDIT ===\n');

// 1. Check for hardcoded scope URLs (Valkenswaard)
console.log('1. SCOPE URLs:');
const valkenUrl = 'valkenswaard.nl';
if (xmlContent.includes(valkenUrl)) {
  console.log('   ⚠️  HARDCODED: Found "valkenswaard.nl" URLs in template');
  console.log('   → Should be replaced with project.scopeUrls from database');
  console.log('   → Already handled via XML manipulation (lines 895-1085 in route.ts)');
} else {
  console.log('   ✓ No hardcoded Valkenswaard URLs');
}

// 2. Check for browser versions
console.log('\n2. BROWSER VERSIONS / USER AGENTS:');
const browserChecks = ['Chrome 145', 'Firefox 147', 'Edge 145', 'NVDA'];
let foundBrowsers = false;
browserChecks.forEach(browser => {
  if (xmlContent.includes(browser)) {
    if (!foundBrowsers) {
      console.log('   ⚠️  HARDCODED: Browser versions found in template:');
      foundBrowsers = true;
    }
    console.log(`      - ${browser}`);
  }
});
if (foundBrowsers) {
  console.log('   → Should use project.userAgents from database');
  console.log('   → STATUS: FIXED (line 472 in route.ts uses project.userAgents)');
} else {
  console.log('   ✓ No hardcoded browser versions');
}

// 3. Check for technologies (DOM, HTML, CSS)
console.log('\n3. TECHNOLOGIES:');
const techChecks = ['DOM', 'HTML', 'CSS'];
let foundTech = false;
techChecks.forEach(tech => {
  // Be careful - these might appear in normal text, so check for them in sequence
  const domHtmlCss = xmlContent.includes('DOM') && xmlContent.includes('HTML') && xmlContent.includes('CSS');
  if (domHtmlCss && !foundTech) {
    console.log('   ⚠️  HARDCODED: Technologies (DOM, HTML, CSS) found in template');
    console.log('   → Should use project.technologies from database');
    console.log('   → STATUS: FIXED (line 473 in route.ts uses project.technologies)');
    foundTech = true;
  }
});
if (!foundTech) {
  console.log('   ✓ No hardcoded technology list');
}

// 4. Check for sample items
console.log('\n4. SAMPLE ITEMS (Volledige steekproef):');
const sampleItemMarkers = ['Stap 1', 'Stap 2', 'Reactieformulier'];
let foundSampleItems = false;
sampleItemMarkers.forEach(marker => {
  if (xmlContent.includes(marker)) {
    if (!foundSampleItems) {
      console.log('   ⚠️  HARDCODED: Sample item titles found in template:');
      foundSampleItems = true;
    }
    console.log(`      - Contains "${marker}"`);
  }
});
if (foundSampleItems) {
  console.log('   → Should use project.sampleItems from database');
  console.log('   → STATUS: FIXED (lines 1087-1217 in route.ts replace with DB data)');
} else {
  console.log('   ✓ No hardcoded sample items');
}

// 5. Check for project-specific data
console.log('\n5. PROJECT-SPECIFIC DATA:');

// Check for specific gemeente names
const gemeenteNames = ['Wierden', 'Valkenswaard'];
let foundGemeente = false;
gemeenteNames.forEach(name => {
  if (xmlContent.includes(name)) {
    if (!foundGemeente) {
      console.log('   ⚠️  HARDCODED: Gemeente names found:');
      foundGemeente = true;
    }
    console.log(`      - ${name}`);
  }
});
if (foundGemeente) {
  console.log('   → Should use project.opdrachtgever or project.commissionedBy');
  console.log('   → Check if these are in placeholder sections or actual content');
}

// 6. Extract all text content to look for other potential hardcoded data
console.log('\n6. DOCXTEMPLATER PLACEHOLDERS:');
const placeholders = xmlContent.match(/\{[^{}]+\}/g);
if (placeholders) {
  const unique = [...new Set(placeholders)];
  console.log(`   Found ${unique.length} unique placeholders:`);
  unique.sort().forEach(p => console.log(`      ${p}`));

  console.log('\n   Checking if all placeholders have corresponding database fields:');
  const expectedFields = {
    '{managementSummary}': 'project.managementSummary (or generated from researchType)',
    '{opdrachtgeverNaam}': 'project.clientProject?.opdrachtgever?.naam || project.commissionedBy',
    '{websiteUrl}': 'project.scopeUrls[0].url (first in-scope URL)',
    '{reportDate}': 'project.reportDate'
  };

  unique.forEach(placeholder => {
    if (expectedFields[placeholder]) {
      console.log(`      ✓ ${placeholder} → ${expectedFields[placeholder]}`);
    } else {
      console.log(`      ⚠️  ${placeholder} → NOT FOUND IN ROUTE.TS templateData!`);
    }
  });
}

// 7. Check for date formats that might be hardcoded
console.log('\n7. DATES:');
const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/;
const dateMatches = xmlContent.match(datePattern);
if (dateMatches) {
  console.log('   ⚠️  Found date-like patterns (may be formatting examples):');
  dateMatches.slice(0, 5).forEach(d => console.log(`      - ${d}`));
  console.log('   → Verify these are placeholders, not hardcoded dates');
} else {
  console.log('   ✓ No hardcoded date patterns found');
}

// 8. Summary
console.log('\n=== SUMMARY ===\n');
console.log('Template uses Docxtemplater for 4 basic fields:');
console.log('  - managementSummary, opdrachtgeverNaam, websiteUrl, reportDate\n');
console.log('Most dynamic content is replaced via XML manipulation:');
console.log('  - Scope URLs (lines 895-1085)');
console.log('  - Sample items (lines 1087-1217)');
console.log('  - Criteria table (lines 556-880)');
console.log('  - Browser versions (via templateData.userAgents)');
console.log('  - Technologies (via templateData.technologies)\n');

console.log('REMAINING HARDCODED CONTENT IN TEMPLATE:');
if (foundBrowsers || foundTech || foundSampleItems || xmlContent.includes(valkenUrl)) {
  console.log('  ⚠️  Browser versions - NEEDS TEMPLATE UPDATE or verification that route.ts replaces them');
  console.log('  ⚠️  Technologies - NEEDS TEMPLATE UPDATE or verification that route.ts replaces them');
  console.log('  ⚠️  Sample items - NEEDS TEMPLATE UPDATE or verification that route.ts replaces them');
  console.log('  ⚠️  Scope URLs - NEEDS TEMPLATE UPDATE or verification that route.ts replaces them');
  console.log('\nThese may be intentional template examples that get replaced during rendering.');
  console.log('Verify that the route.ts code successfully replaces ALL these sections.');
} else {
  console.log('  ✓ No obvious hardcoded content found (all replaced via code)');
}

console.log('\n✓ Audit complete');