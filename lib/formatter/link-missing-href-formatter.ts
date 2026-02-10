/**
 * Formatter for LinkMissingHrefTest results
 * Converts JSON test results into readable Dutch reports
 */

interface LinkIssue {
  element: string;
  hrefValue: string;
  reason: string;
  context: string;
}

interface TestDetails {
  issues: LinkIssue[];
  totalCount: number;
  classification?: string;
  wcagLevel?: string;
  wcagCriteria?: string[];
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
 * Categorize issue by type
 */
function categorizeIssue(hrefValue: string): string {
  if (hrefValue === '<geen href>') {
    return 'ontbrekend';
  } else if (hrefValue === '""') {
    return 'leeg';
  } else {
    return 'placeholder';
  }
}

/**
 * Format a single issue into a readable report
 */
export function formatSingleIssue(issue: LinkIssue): Report {
  const contextNL = translateContext(issue.context);
  const issueType = categorizeIssue(issue.hrefValue);
  const elementText = issue.element === '<geen tekst>' ? 'een link zonder tekst' : `de link "${issue.element}"`;

  // Build bevinding
  let bevinding = '';
  if (issueType === 'ontbrekend') {
    bevinding = `Link zonder href-attribuut in de ${contextNL}.`;
  } else if (issueType === 'leeg') {
    bevinding = `Link met leeg href-attribuut in de ${contextNL}.`;
  } else {
    bevinding = `Link met placeholder href in de ${contextNL}.`;
  }

  // Build details
  let details = `In de ${contextNL} bevat ${elementText} `;
  if (issueType === 'ontbrekend') {
    details += `geen href-attribuut. Dit betekent dat de link niet functioneert als een werkbare hyperlink.`;
  } else if (issueType === 'leeg') {
    details += `een leeg href-attribuut (href=""). Dit betekent dat de link niet naar een bestemming verwijst.`;
  } else {
    details += `een placeholder href (${issue.hrefValue}). Dit betekent dat de link niet naar een functionele bestemming leidt.`;
  }

  // Build advies
  const advies = `Geef de link een geldig href-attribuut dat naar een werkende bestemming verwijst. Als de link geen bestemming heeft, overweeg dan om een button-element te gebruiken in plaats van een link. Dit is cruciaal voor toetsenbordgebruikers en schermlezers die afhankelijk zijn van werkende links om door de website te navigeren (WCAG 2.1.1, 2.4.4 - Level A).`;

  return {
    bevinding,
    details,
    advies
  };
}

/**
 * Format all issues from test details into readable reports
 */
export function formatLinkMissingHrefReport(testDetails: TestDetails): Report[] {
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
export function formatLinkMissingHrefTestResult(jsonString: string): string {
  try {
    const testDetails: TestDetails = typeof jsonString === 'string'
      ? JSON.parse(jsonString)
      : jsonString;

    const reports = formatLinkMissingHrefReport(testDetails);
    return formatReportsAsText(reports);
  } catch (error) {
    console.error('Error formatting test result:', error);
    return 'Error: Kon het JSON-object niet parsen.';
  }
}

// Export individual functions for flexibility
export default {
  formatSingleIssue,
  formatLinkMissingHrefReport,
  formatReportsAsText,
  formatLinkMissingHrefTestResult
};