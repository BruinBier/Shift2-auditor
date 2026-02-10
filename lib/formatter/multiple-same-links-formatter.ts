/**
 * Formatter for PageContainsMultipleSameLinksTest results
 * Converts JSON test results into readable Dutch reports
 */

interface LinkInstance {
  text: string;
  count: number;
}

interface LinkIssue {
  url: string;
  linkCount: number;
  uniqueTexts: string[];
  contexts: Record<string, LinkInstance[]>;
}

interface TestDetails {
  issues: LinkIssue[];
  totalLinksAnalyzed?: number;
  classification?: string;
}

interface Report {
  bevinding: string;
  details: string;
  advies: string;
}

/**
 * Vertaal context keys naar Nederlandse termen
 */
function translateContext(context: string): string {
  const translations: Record<string, string> = {
    'header': 'header',
    'navigation': 'navigatie',
    'footer': 'footer',
    'main': 'hoofdinhoud',
    'sidebar': 'zijbalk',
    'other': 'pagina'
  };
  return translations[context] || context;
}

/**
 * Extract page name from URL
 * /authenticate -> 'authenticatiepagina'
 * /contact -> 'contactpagina'
 */
function extractPageName(url: string): string {
  // Remove query parameters and hash
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Extract last segment
  const segments = cleanUrl.split('/').filter(s => s.length > 0);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : 'pagina';

  // If it's just a slash, call it homepage
  if (segments.length === 0) {
    return 'homepage';
  }

  return `${lastSegment}pagina`;
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get first two unique link texts with their contexts
 */
function getFirstTwoVariants(issue: LinkIssue): Array<{text: string, context: string}> {
  const variants: Array<{text: string, context: string}> = [];

  // Iterate through contexts and find first 2 unique texts
  for (const [context, instances] of Object.entries(issue.contexts)) {
    for (const instance of instances) {
      // Only add if text is not already in variants
      if (!variants.find(v => v.text === instance.text)) {
        variants.push({ text: instance.text, context });
      }

      // Stop after finding 2
      if (variants.length >= 2) {
        return variants;
      }
    }
  }

  return variants;
}

/**
 * Format a single issue into a readable report
 */
export function formatSingleIssue(issue: LinkIssue): Report {
  const pageName = extractPageName(issue.url);
  const variants = getFirstTwoVariants(issue);

  // Build bevinding
  const bevinding = `Inconsistente naamgeving voor de ${pageName}.`;

  // Build details
  let details = `De link naar ${issue.url} gebruikt`;

  if (variants.length >= 2) {
    const context1 = translateContext(variants[0].context);
    const context2 = translateContext(variants[1].context);

    details += ` het label "${variants[0].text}" in de ${context1} en "${variants[1].text}" in de ${context2}.`;
  } else if (variants.length === 1) {
    details += ` het label "${variants[0].text}" op meerdere plekken met verschillende varianten.`;
  } else {
    details += ` verschillende labels op verschillende plekken.`;
  }

  // Build advies - pick the first text as the recommended one
  const recommendedText = variants.length > 0 ? variants[0].text : issue.uniqueTexts[0];
  const capitalizedExample = capitalizeFirst(recommendedText);

  const advies = `Synchroniseer de linkteksten. Kies één term (bijv. "${capitalizedExample}") en gebruik deze op alle plekken. Dit zorgt voor een voorspelbare ervaring voor gebruikers die afhankelijk zijn van consistente terminologie (zoals gebruikers met een cognitieve beperking of schermlezer-gebruikers).`;

  return {
    bevinding,
    details,
    advies
  };
}

/**
 * Format all issues from test details into readable reports
 */
export function formatMultipleSameLinksReport(testDetails: TestDetails): Report[] {
  if (!testDetails.issues || testDetails.issues.length === 0) {
    return [];
  }

  return testDetails.issues.map(issue => formatSingleIssue(issue));
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
export function formatMultipleSameLinksTestResult(jsonString: string): string {
  try {
    const testDetails: TestDetails = typeof jsonString === 'string'
      ? JSON.parse(jsonString)
      : jsonString;

    const reports = formatMultipleSameLinksReport(testDetails);
    return formatReportsAsText(reports);
  } catch (error) {
    console.error('Error formatting test result:', error);
    return 'Error: Kon het JSON-object niet parsen.';
  }
}

// Export individual functions for flexibility
export default {
  formatSingleIssue,
  formatMultipleSameLinksReport,
  formatReportsAsText,
  formatMultipleSameLinksTestResult
};