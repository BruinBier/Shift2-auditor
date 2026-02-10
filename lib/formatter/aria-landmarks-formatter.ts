/**
 * Formatter for AriaLandmarksTest results
 * Formats SIA-R56 violations (duplicate landmarks without unique names) into readable reports
 */

export interface AriaLandmarksReport {
  bevinding: string;
  details: string;
  advies: string;
}

export function formatAriaLandmarksReport(testDetails: any): AriaLandmarksReport[] {
  const reports: AriaLandmarksReport[] = [];

  // Check if there are any issues
  if (!testDetails?.issues || testDetails.issues.length === 0) {
    return reports;
  }

  // Process each issue
  testDetails.issues.forEach((issue: any) => {
    const landmarkType = issue.landmarkType;
    const count = issue.count;
    const problematicLandmarks = issue.problematicLandmarks || [];

    // Map landmark types to Dutch names
    const landmarkNames: Record<string, string> = {
      'banner': 'banner (header)',
      'navigation': 'navigatie',
      'main': 'hoofdinhoud',
      'contentinfo': 'footer',
      'complementary': 'aanvullende content (aside)',
      'search': 'zoekfunctie',
    };

    const landmarkNameNL = landmarkNames[landmarkType] || landmarkType;

    // Build the bevinding (finding)
    let bevinding = `De pagina bevat ${count} ${landmarkNameNL}-landmarks zonder unieke toegankelijke namen. Dit is een serieuze toegankelijkheidsfout (WCAG 2.4.1, 4.1.2, Niveau A).`;

    // Build the details
    let details = `Ernst: Serieus (SIA-R56 violation)\n\n`;
    details += `Er zijn ${count} ${landmarkNameNL}-landmarks op de pagina gevonden. `;

    // Count how many have no name vs duplicate names
    const withoutName = problematicLandmarks.filter((lm: any) => lm.accessibleName === '(geen naam)').length;
    const withDuplicateName = problematicLandmarks.length - withoutName;

    if (withoutName > 0 && withDuplicateName > 0) {
      details += `Hiervan hebben ${withoutName} landmark(s) geen toegankelijke naam en ${withDuplicateName} landmark(s) dezelfde naam als een andere landmark. `;
    } else if (withoutName > 0) {
      details += `Hiervan hebben ${withoutName} landmark(s) geen toegankelijke naam. `;
    } else if (withDuplicateName > 0) {
      details += `Hiervan hebben ${withDuplicateName} landmark(s) dezelfde naam als een andere landmark. `;
    }

    // Add location information
    const locations = problematicLandmarks
      .map((lm: any) => lm.location)
      .filter((loc: string, idx: number, arr: string[]) => arr.indexOf(loc) === idx);

    if (locations.length > 0) {
      const locationNames: Record<string, string> = {
        'header': 'header',
        'nav': 'navigatie',
        'main': 'hoofdinhoud',
        'article': 'artikel',
        'aside': 'zijbalk',
        'footer': 'footer',
        'body': 'body',
      };
      const locationList = locations.map((loc: string) => locationNames[loc] || loc).join(', ');
      details += `Deze landmarks bevinden zich in: ${locationList}. `;
    }

    details += '\n\n';
    details += 'Voorbeelden van problematische landmarks:\n';

    problematicLandmarks.slice(0, 3).forEach((lm: any, idx: number) => {
      const tagInfo = lm.role ? `<${lm.tag} role="${lm.role}">` : `<${lm.tag}>`;
      const nameInfo = lm.accessibleName === '(geen naam)' ? 'geen toegankelijke naam' : `naam: "${lm.accessibleName}"`;
      details += `${idx + 1}. ${tagInfo} - ${nameInfo} (locatie: ${lm.location})\n`;
    });

    // Build the advies (advice)
    let advies = `Geef elke ${landmarkNameNL}-landmark een unieke toegankelijke naam met behulp van het \`aria-label\` of \`aria-labelledby\` attribuut. `;
    advies += `Dit helpt gebruikers van schermlezers om snel te navigeren tussen verschillende ${landmarkNameNL}-gebieden op de pagina.\n\n`;
    advies += 'Voorbeeld:\n';
    advies += `<nav aria-label="Hoofdnavigatie">\n`;
    advies += `  <!-- navigatie items -->\n`;
    advies += `</nav>\n\n`;
    advies += `<nav aria-label="Footer navigatie">\n`;
    advies += `  <!-- footer navigatie items -->\n`;
    advies += `</nav>\n\n`;
    advies += 'Dit voldoet aan WCAG 2.4.1 (Blokken omzeilen) en WCAG 4.1.2 (Naam, rol, waarde) op niveau A.';

    reports.push({
      bevinding,
      details,
      advies,
    });
  });

  return reports;
}