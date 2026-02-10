/**
 * Formatter for ElementsStyledWithStrongOrEmTest
 * Formats test results for misuse of <strong> or <em> for styling long text blocks
 */

export interface ElementStyledWithStrongOrEmIssue {
  tagName: 'STRONG' | 'EM';
  wordCount: number;
  textSnippet: string;
  reason: string;
  location: string;
}

export interface ElementsStyledWithStrongOrEmDetails {
  issues: ElementStyledWithStrongOrEmIssue[];
  totalCount: number;
  classification: string;
}

export interface FormattedElementStyledWithStrongOrEm {
  summary: string;
  issuesByLocation: Map<string, ElementStyledWithStrongOrEmIssue[]>;
  issuesByTag: {
    strong: number;
    em: number;
  };
  totalIssues: number;
}

export function formatElementsStyledWithStrongOrEm(
  details: ElementsStyledWithStrongOrEmDetails
): FormattedElementStyledWithStrongOrEm {
  const { issues, totalCount } = details;

  // Group issues by location
  const issuesByLocation = new Map<string, ElementStyledWithStrongOrEmIssue[]>();

  issues.forEach(issue => {
    const location = issue.location;
    if (!issuesByLocation.has(location)) {
      issuesByLocation.set(location, []);
    }
    issuesByLocation.get(location)!.push(issue);
  });

  // Count by tag type
  const strongCount = issues.filter(i => i.tagName === 'STRONG').length;
  const emCount = issues.filter(i => i.tagName === 'EM').length;

  // Generate summary
  const summary = `
Gevonden: ${totalCount} ${totalCount === 1 ? 'element' : 'elementen'} met misbruik van <strong> of <em>
- <strong>: ${strongCount}x
- <em>: ${emCount}x

Locaties:
${Array.from(issuesByLocation.entries())
  .map(([loc, iss]) => `- ${loc}: ${iss.length}x`)
  .join('\n')}
  `.trim();

  return {
    summary,
    issuesByLocation,
    issuesByTag: {
      strong: strongCount,
      em: emCount,
    },
    totalIssues: totalCount,
  };
}