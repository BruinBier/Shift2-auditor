/**
 * Formatter for ImgAltTooShortTest results
 * Converts JSON test results into readable Dutch reports
 */

interface ImageDetail {
  src?: string;
  class?: string;
  altLength: number;
  alt: string;
}

interface TestDetails {
  images: ImageDetail[];
  totalCount: number;
  wcagLevel?: string;
  wcagCriteria?: string[];
  classification?: string;
}

interface Report {
  bevinding: string;
  details: string;
  advies: string;
}

/**
 * Get a short display name for image source
 */
function getImageDisplayName(src?: string): string {
  if (!src) return 'Afbeelding zonder src';

  // Extract filename from URL/path
  const parts = src.split('/');
  const filename = parts[parts.length - 1];

  // If filename is too long, truncate it
  if (filename.length > 50) {
    return filename.substring(0, 47) + '...';
  }

  return filename || src;
}

/**
 * Format a single image issue into a readable report
 */
export function formatSingleImage(image: ImageDetail, index: number, totalCount: number): Report {
  const displayName = getImageDisplayName(image.src);
  const hasClass = image.class && image.class.trim().length > 0;

  // Build bevinding
  const bevinding = `Afbeelding met te kort alt-attribuut${totalCount > 1 ? ` (${index + 1} van ${totalCount})` : ''}.`;

  // Build details
  let details = `De afbeelding "${displayName}" heeft een alt-attribuut van slechts ${image.altLength} karakter${image.altLength !== 1 ? 's' : ''}: "${image.alt}". `;

  if (hasClass) {
    details += `De afbeelding heeft CSS class "${image.class}". `;
  }

  details += `Een alt-tekst van ${image.altLength} karakter${image.altLength !== 1 ? 's' : ''} is te kort om nuttige informatie te bieden aan gebruikers met een schermlezer. Alt-teksten moeten beschrijvend zijn en de inhoud of functie van de afbeelding duidelijk maken.`;

  // Build advies
  const advies = `Vervang de alt-tekst "${image.alt}" door een beschrijvende tekst die de inhoud of functie van de afbeelding uitlegt. Een goede alt-tekst is doorgaans ten minste 5-10 karakters lang en beschrijft wat er te zien is of wat de functie van de afbeelding is. Als de afbeelding puur decoratief is en geen informatie toevoegt, gebruik dan een leeg alt-attribuut (alt="") in plaats van een betekenisloze korte tekst. Dit is een WCAG Level A vereiste (Succescriterium 1.1.1: Niet-tekstuele content).`;

  return {
    bevinding,
    details,
    advies
  };
}

/**
 * Format all images from test details into readable reports
 */
export function formatImgAltTooShortReport(testDetails: TestDetails): Report[] {
  if (!testDetails.images || testDetails.images.length === 0) {
    return [];
  }

  // Only format the first 5 for display purposes
  const imagesToDisplay = testDetails.images.slice(0, 5);
  const totalCount = testDetails.totalCount;

  const reports = imagesToDisplay.map((image, index) =>
    formatSingleImage(image, index, totalCount)
  );

  // Add summary report if there are more than 5
  if (totalCount > 5) {
    reports.push({
      bevinding: `Totaal ${totalCount} afbeeldingen met te kort alt-attribuut gevonden.`,
      details: `Er zijn in totaal ${totalCount} afbeeldingen met een te kort alt-attribuut (1-3 karakters) op deze pagina gevonden. Hierboven worden de eerste 5 weergegeven. Alle afbeeldingen moeten een beschrijvend alt-attribuut hebben voor toegankelijkheid.`,
      advies: `Vervang bij alle ${totalCount} afbeeldingen de te korte alt-teksten door beschrijvende teksten die de inhoud of functie van de afbeelding uitleggen. Voor decoratieve afbeeldingen gebruik je alt="".`
    });
  }

  return reports;
}

/**
 * Format reports into plain text
 */
export function formatReportsAsText(reports: Report[]): string {
  return reports.map((report, index) => {
    return `
=== Issue ${index + 1} ===

Bevinding: ${report.bevinding}

Details: ${report.details}

Advies: ${report.advies}
`.trim();
  }).join('\n\n---\n\n');
}

/**
 * Main function - parse JSON and return formatted text
 */
export function formatImgAltTooShortTestResult(jsonString: string): string {
  try {
    const testDetails: TestDetails = typeof jsonString === 'string'
      ? JSON.parse(jsonString)
      : jsonString;

    const reports = formatImgAltTooShortReport(testDetails);
    return formatReportsAsText(reports);
  } catch (error) {
    console.error('Error formatting test result:', error);
    return 'Error: Kon het JSON-object niet parsen.';
  }
}

// Export individual functions for flexibility
export default {
  formatSingleImage,
  formatImgAltTooShortReport,
  formatReportsAsText,
  formatImgAltTooShortTestResult
};