/**
 * Script to create a clean Word template from the existing template
 * This preserves styling but removes all hardcoded content and creates proper placeholders
 */

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Paths
const CURRENT_TEMPLATE_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - with placeholders.docx');
const BACKUP_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - BACKUP-BEFORE-CLEAN-' + Date.now() + '.docx');
const NEW_TEMPLATE_PATH = path.join(__dirname, '../templates/website/Toegankelijkheidsonderzoek website Template - CLEAN-NEW.docx');

console.log('🧹 Creating clean Word template...\n');

// Backup current template first
console.log('📦 Creating backup of current template...');
fs.copyFileSync(CURRENT_TEMPLATE_PATH, BACKUP_PATH);
console.log(`✅ Backup saved to: ${path.basename(BACKUP_PATH)}\n`);

// Read the current template
console.log('📖 Reading current template...');
const content = fs.readFileSync(CURRENT_TEMPLATE_PATH, 'binary');
const zip = new PizZip(content);

// Get document.xml
const documentXml = zip.file('word/document.xml').asText();

console.log('✅ Current template loaded\n');

// Now we'll create a minimal document structure
// We'll preserve the styles.xml and other formatting files, but replace document.xml

const minimalDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>

    <!-- Cover Page -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:t>Toegankelijkheidsonderzoek</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Subtitle"/>
      </w:pPr>
      <w:r>
        <w:t>{projectSubject}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Rapportdatum: {reportDate}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Versie: {version}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Uitgevoerd door: {auditedByOrg}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>

    <!-- Table of Contents -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop1"/>
      </w:pPr>
      <w:r>
        <w:t>Inhoudsopgave</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:fldChar w:fldCharType="begin"/>
      </w:r>
      <w:r>
        <w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText>
      </w:r>
      <w:r>
        <w:fldChar w:fldCharType="separate"/>
      </w:r>
      <w:r>
        <w:t>[Inhoudsopgave - klik met rechtermuisknop en kies "Veld bijwerken"]</w:t>
      </w:r>
      <w:r>
        <w:fldChar w:fldCharType="end"/>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>

    <!-- 1. Samenvatting -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop1"/>
      </w:pPr>
      <w:bookmarkStart w:id="0" w:name="_Toc_Samenvatting"/>
      <w:r>
        <w:t>Samenvatting</w:t>
      </w:r>
      <w:bookmarkEnd w:id="0"/>
    </w:p>

    <!-- Summary will be inserted dynamically by the API -->

    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>

    <!-- 2. Over het onderzoek -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop1"/>
      </w:pPr>
      <w:r>
        <w:t>Over het onderzoek</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Inleiding</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{reportIntroHeader}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{aboutResearchText}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Reikwijdte</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{scopeInfo}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop3"/>
      </w:pPr>
      <w:r>
        <w:t>Binnen de reikwijdte</w:t>
      </w:r>
    </w:p>

    <!-- Scope URLs in scope - will be inserted by API -->
    <w:p>
      <w:r>
        <w:t>[Scope URLs binnen reikwijdte worden hier ingevoegd]</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop3"/>
      </w:pPr>
      <w:r>
        <w:t>Buiten de reikwijdte</w:t>
      </w:r>
    </w:p>

    <!-- Scope URLs out of scope - will be inserted by API -->
    <w:p>
      <w:r>
        <w:t>[Scope URLs buiten reikwijdte worden hier ingevoegd]</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Steekproef</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{sampleInfo}</w:t>
      </w:r>
    </w:p>

    <!-- Sample items - will be inserted by API -->
    <w:p>
      <w:r>
        <w:t>[Steekproef items worden hier ingevoegd]</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Testomgeving</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{testEnvironmentIntro}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop3"/>
      </w:pPr>
      <w:r>
        <w:t>Browsers en hulpmiddelen</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{userAgents}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop3"/>
      </w:pPr>
      <w:r>
        <w:t>Technologieën</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{technologies}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Methodiek</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{methodologyDetailText}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>

    <!-- 3. Resultaten -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop1"/>
      </w:pPr>
      <w:r>
        <w:t>Resultaten</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Overzicht succescriteria</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{criteriaCountText}</w:t>
      </w:r>
    </w:p>

    <!-- Criteria Table - will be replaced by API -->
    <w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="5000" w:type="pct"/>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p>
            <w:r>
              <w:rPr>
                <w:b/>
              </w:rPr>
              <w:t>Succescriterium</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:r>
              <w:rPr>
                <w:b/>
              </w:rPr>
              <w:t>Voldoet</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:r>
              <w:rPr>
                <w:b/>
              </w:rPr>
              <w:t>Opmerkingen</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:p>
            <w:r>
              <w:t>1.1.1 Niet-tekstuele content</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:r>
              <w:t>Ja</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:p>
            <w:r>
              <w:t></w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>

    <!-- 4. Bevindingen -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop1"/>
      </w:pPr>
      <w:r>
        <w:t>Bevindingen</w:t>
      </w:r>
    </w:p>

    <!-- Findings will be inserted by API -->
    <w:p>
      <w:r>
        <w:t>[Bevindingen worden hier ingevoegd]</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pageBreakBefore/>
      </w:pPr>
    </w:p>

    <!-- 5. Conclusie -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop1"/>
      </w:pPr>
      <w:r>
        <w:t>Conclusie</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{conclusionText}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Geldigheid</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{validityText}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:pStyle w:val="Kop2"/>
      </w:pPr>
      <w:r>
        <w:t>Continuïteit en monitoring</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{continuityAdvice1}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>{continuityAdvice2}</w:t>
      </w:r>
    </w:p>

    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

console.log('🔨 Building new clean template...');
console.log('📝 Preserving all styling files (styles.xml, numbering.xml, etc.)...');

// Replace document.xml with our clean version
// All other files (styles.xml, numbering.xml, theme/, etc.) are preserved from original
zip.file('word/document.xml', minimalDocumentXml);

// Also update document.xml.rels to include necessary relationships
const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rId100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/" TargetMode="External"/>
  <Relationship Id="rId101" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek" TargetMode="External"/>
</Relationships>`;

zip.file('word/_rels/document.xml.rels', relsXml);

console.log('✅ Styling files preserved from original template');

// Generate the new docx file
const newContent = zip.generate({ type: 'nodebuffer' });

// Write the new template
fs.writeFileSync(NEW_TEMPLATE_PATH, newContent);

console.log(`✅ New clean template created: ${path.basename(NEW_TEMPLATE_PATH)}\n`);

console.log('📋 Summary:');
console.log(`   • Backup: ${path.basename(BACKUP_PATH)}`);
console.log(`   • New template: ${path.basename(NEW_TEMPLATE_PATH)}`);
console.log(`   • Original: ${path.basename(CURRENT_TEMPLATE_PATH)}\n`);

console.log('⚠️  IMPORTANT: The new template needs styling! You should:');
console.log('   1. Open the new template in Word');
console.log('   2. Apply your custom styles (Kop1, Kop2, Kop3, etc.)');
console.log('   3. Format the table styling');
console.log('   4. Save and replace the current template\n');

console.log('✨ Done!');