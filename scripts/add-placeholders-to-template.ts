import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// Read the template
const templatePath = path.join(process.cwd(), 'templates', 'formulieren', 'Toegankelijkheidsonderzoek formulieren Template.docx');
const content = fs.readFileSync(templatePath, 'binary');

// Load the template
const zip = new PizZip(content);

// Get the main document XML
let documentXml = zip.file('word/document.xml')?.asText();

if (!documentXml) {
  console.error('Could not read document.xml from template');
  process.exit(1);
}

console.log('Original template loaded. Applying replacements...\n');

// Define all replacements - ORDER MATTERS! More specific patterns first
const replacements = [
  // Dates - specific dates first before general patterns
  { find: '9 maart 2026', replace: '{dateStart}' },
  { find: '23 maart 2026', replace: '{dateEnd}' },
  { find: '28 februari 2026', replace: '{reportDate}' },

  // URLs - specific URLs before generic patterns
  { find: 'https://www.valkenswaard.nl/', replace: '{websiteUrl}' },
  { find: 'www.valkenswaard.nl', replace: '{websiteUrl}' },

  // Project-specific text
  { find: 'Toegankelijkheidsonderzoek formulieren Valkenswaard', replace: 'Toegankelijkheidsonderzoek formulieren {projectSubject}' },
  { find: 'Toegankelijkheidsonderzoek website Valkenswaard', replace: 'Toegankelijkheidsonderzoek website {projectSubject}' },
  { find: 'Valkenswaard', replace: '{projectSubject}' },

  // Client/Organization info
  { find: 'A2gemeenten', replace: '{opdrachtgeverNaam}' },
  { find: 'Shift2', replace: '{auditedByOrg}' },

  // Version number in specific context
  { find: 'Raportversie:1.0', replace: 'Raportversie:{version}' },

  // Research type specific
  { find: 'WCAG 2.2 AA  Deelonderzoek content', replace: '{standard} {level}  {researchType}' },
  { find: 'WCAG 2.2 niveau A en AA', replace: '{standard} niveau {level}' },

  // Sample info - specific patterns
  { find: '3 gepubliceerde formulieren', replace: '{totalSampleItems} gepubliceerde formulieren' },

  // Statistics placeholders - be careful with these
  // We'll use more specific patterns to avoid replacing wrong numbers

  // Technology/browser versions might change
  { find: 'Google Chrome 145', replace: '{browserChrome}' },
  { find: 'Mozilla Firefox 147', replace: '{browserFirefox}' },
  { find: 'Microsoft Edge 145', replace: '{browserEdge}' },
  { find: 'NVDA \\(Windows\\)', replace: '{screenReader}' },

  // Large text blocks - Samenvatting section (first paragraph)
  { find: 'Dit onderzoek is door Shift2 uitgevoerd tussen 9 maart 2026 en 23 maart 2026\\. Voor dit deelonderzoek is een representatieve steekproef samengesteld van 3 gepubliceerde formulieren binnen de Shift2-omgeving met verschillende kenmerken en complexiteitsniveaus\\.',
    replace: 'Dit onderzoek is door {auditedByOrg} uitgevoerd tussen {dateStart} en {dateEnd}. Voor dit deelonderzoek is een representatieve steekproef samengesteld van {totalSampleItems} gepubliceerde formulieren binnen de {auditedByOrg}-omgeving met verschillende kenmerken en complexiteitsniveaus.' },

  // Samenvatting - second paragraph (results summary)
  { find: 'De onderzochte formuliercontent voldoet niet volledig aan WCAG 2\\.2 niveau A en AA\\. In dit deelonderzoek zijn 30 succescriteria beoordeeld\\. Er wordt voldaan aan 0 van deze 30 succescriteria \\(0%\\)\\. Bij 0 succescriteria zijn afwijkingen vastgesteld\\.',
    replace: '{managementSummary}' },

  // Samenvatting - third paragraph (advice)
  { find: 'Wij adviseren om formuliercontent periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces van formulieren\\.',
    replace: '{managementSummaryAdvice}' },

  // Over dit onderzoek - first paragraph
  { find: 'Voor de formulieren binnen de Shift2-omgeving is een deelonderzoek uitgevoerd naar de toegankelijkheid van de content, om vast te stellen in hoeverre deze voldoet aan WCAG 2\\.2 niveau A en AA \\(EN 301 549\\)\\.',
    replace: '{aboutResearchText}' },

  // Over dit onderzoek - validity paragraph
  { find: 'De geldigheid van dit onderzoeksrapport bedraagt maximaal drie jaar\\. Bij substantiële wijzigingen in de content of het publicatieproces adviseren wij een aanvullend of nieuw onderzoek uit te laten voeren\\.',
    replace: '{validityText}' },

  // Afbakening section - first paragraph
  { find: 'Dit deelonderzoek heeft uitsluitend betrekking op de content van de formulieren binnen de Shift2-omgeving die door de organisatie via het beheersysteem kan worden ingevoerd of aangepast\\.',
    replace: '{scopeInfo}' },

  // Afbakening - criteria counts
  { find: 'Bij dit onderzoek zijn 30 van de 55 succescriteria van WCAG 2\\.2 niveau A en AA beoordeeld\\.',
    replace: '{criteriaCountText}' },

  // Afbakening - other criteria paragraph
  { find: 'De overige 25 succescriteria hebben betrekking op de technische basis van de formulieren en worden beoordeeld in het afzonderlijk deelonderzoek techniek\\.',
    replace: '{otherCriteriaText}' },

  // Afbakening - combined assessment
  { find: 'Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de formulieren binnen de Shift2-omgeving\\.',
    replace: '{combinedAssessmentText}' },

  // Reikwijdte section - first paragraph
  { find: 'Het onderzoek is uitgevoerd op basis van een representatieve steekproef van formulieren binnen de Shift2-omgeving\\. Binnen deze steekproef zijn de aangetroffen toegankelijkheidsproblemen zo concreet mogelijk beschreven, inclusief verwijzing naar het betreffende formulier of formulieronderdeel\\. Waar mogelijk is een aanbeveling opgenomen om de afwijking te verhelpen\\.',
    replace: '{methodologyText}' },

  // Reikwijdte - snapshot warning
  { find: 'Dit onderzoek biedt geen uitputtend overzicht van alle mogelijke toegankelijkheidsproblemen\\. De bevindingen vormen een momentopname van de situatie ten tijde van het onderzoek\\.',
    replace: '{snapshotWarningText}' },

  // Borging en vervolg section
  { find: 'Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen in formulieren die niet zijn onderzocht\\. Het is daarom raadzaam om alle online formulieren te controleren op vergelijkbare patronen en deze structureel te monitoren\\.',
    replace: '{continuityAdvice1}' },

  { find: 'Daarnaast kunnen wijzigingen in de inhoud van formulieren of in het publicatieproces nieuwe toegankelijkheidsrisico\'s met zich meebrengen\\. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling van de formulieren blijven daarom noodzakelijk\\.',
    replace: '{continuityAdvice2}' },

  // Scope section - intro text
  { find: 'Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen\\. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM\\.',
    replace: '{scopeExplanation}' },

  // Steekproef section - intro
  { find: 'Dit onderzoek is uitgevoerd op basis van een steekproef\\. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM\\. Als een proces is meegenomen in het onderzoek staan ook alle procespagina\'s in de steekproef vermeld\\. Zie: https://www\\.digitoegankelijk\\.nl/aanpak/toegankelijkheidsonderzoek\\.',
    replace: '{sampleInfo}' },

  // Onderzoeksmethode section
  { find: 'Dit onderzoek is uitgevoerd conform de evaluatiemethode WCAG-EM\\. Deze methode is aanbevolen door DigiToegankelijk \\(Logius\\)\\. Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden\\.',
    replace: '{methodologyDetailText}' },

  // Test environment intro
  { find: 'Het basisniveau van ondersteuning bestaat uit gangbare webbrowsers en hulptechnologieën\\. Het onderzoek is uitgevoerd met:',
    replace: '{testEnvironmentIntro}' },
];

// Apply replacements
let replacementCount = 0;
replacements.forEach(({ find, replace }) => {
  const regex = new RegExp(find, 'g');
  const matches = documentXml!.match(regex);
  if (matches) {
    console.log(`Replacing "${find}" with "${replace}" (${matches.length} occurrences)`);
    documentXml = documentXml!.replace(regex, replace);
    replacementCount += matches.length;
  }
});

console.log(`\nTotal replacements: ${replacementCount}`);

// Update the document XML in the zip
zip.file('word/document.xml', documentXml);

// Generate the new template
const newTemplateBuffer = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE'
});

// Save the new template
const newTemplatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

fs.writeFileSync(newTemplatePath, newTemplateBuffer);

console.log(`\n✓ New template saved to: ${newTemplatePath}`);
console.log('\nNext steps:');
console.log('1. Open the new template in Word');
console.log('2. Review the placeholders');
console.log('3. Add any additional placeholders manually if needed');
console.log('4. Save and rename to replace the original template');