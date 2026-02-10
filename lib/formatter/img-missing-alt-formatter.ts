/**
 * Formatter for ImgMissingAltTest results
 * Converts JSON test results into readable Dutch reports
 */

interface ImageDetail {
  src?: string;
  class?: string;
}

interface TestDetails {
  images: ImageDetail[];
  totalCount: number;
  wcagLevel?: string;
  critical?: boolean;
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
  const bevinding = `Afbeelding zonder alt-attribuut${totalCount > 1 ? ` (${index + 1} van ${totalCount})` : ''}.`;

  // Build details
  let details = `De afbeelding "${displayName}" heeft geen alt-attribuut. `;

  if (hasClass) {
    details += `De afbeelding heeft CSS class "${image.class}". `;
  }

  details += `Het ontbreken van een alt-attribuut maakt de afbeelding ontoegankelijk voor schermlezers. Gebruikers die blind of slechtziend zijn krijgen geen informatie over wat de afbeelding toont.`;

  // Build advies
  const advies = `Voeg een alt-attribuut toe aan de afbeelding met een beschrijvende tekst. Als de afbeelding decoratief is en geen informatieve waarde heeft, gebruik dan een leeg alt-attribuut (alt=""). Voor informatieve afbeeldingen, beschrijf kort en bondig wat er te zien is. Dit is een WCAG Level A vereiste (Succescriterium 1.1.1: Niet-tekstuele content).`;

  return {
    bevinding,
    details,
    advies
  };
}

/**
 * Format all images from test details into readable reports
 */
export function formatImgMissingAltReport(testDetails: TestDetails): Report[] {
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
      bevinding: `Totaal ${totalCount} afbeeldingen zonder alt-attribuut gevonden.`,
      details: `Er zijn in totaal ${totalCount} afbeeldingen zonder alt-attribuut op deze pagina gevonden. Hierboven worden de eerste 5 weergegeven. Alle afbeeldingen moeten een alt-attribuut hebben voor toegankelijkheid.`,
      advies: `Voeg aan alle ${totalCount} afbeeldingen een passend alt-attribuut toe. Gebruik beschrijvende tekst voor informatieve afbeeldingen en alt="" voor decoratieve afbeeldingen.`
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
export function formatImgMissingAltTestResult(jsonString: string): string {
  try {
    const testDetails: TestDetails = typeof jsonString === 'string'
      ? JSON.parse(jsonString)
      : jsonString;

    const reports = formatImgMissingAltReport(testDetails);
    return formatReportsAsText(reports);
  } catch (error) {
    console.error('Error formatting test result:', error);
    return 'Error: Kon het JSON-object niet parsen.';
  }
}

// Export individual functions for flexibility
export default {
  formatSingleImage,
  formatImgMissingAltReport,
  formatReportsAsText,
  formatImgMissingAltTestResult
};