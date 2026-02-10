/**
 * Formatter for StrongHasMoreThanFourWordsTest
 * Formats test results for <strong> elements exceeding 4 words
 */

export interface StrongFourWordsIssue {
  tagName: 'STRONG';
  wordCount: number;
  textSnippet: string;
  reason: string;
  location: string;
}

export interface StrongFourWordsDetails {
  issues: StrongFourWordsIssue[];
  totalCount: number;
  classification: string;
}

export interface FormattedStrongFourWords {
  summary: string;
  issuesByLocation: Map<string, StrongFourWordsIssue[]>;
  issuesByWordCount: Map<number, number>;
  totalIssues: number;
  averageWordCount: number;
}

export function formatStrongFourWords(
  details: StrongFourWordsDetails
): FormattedStrongFourWords {
  const { issues, totalCount } = details;

  // Group issues by location
  const issuesByLocation = new Map<string, StrongFourWordsIssue[]>();

  issues.forEach(issue => {
    const location = issue.location;
    if (!issuesByLocation.has(location)) {
      issuesByLocation.set(location, []);
    }
    issuesByLocation.get(location)!.push(issue);
  });

  // Group by word count
  const issuesByWordCount = new Map<number, number>();
  let totalWords = 0;

  issues.forEach(issue => {
    const count = issue.wordCount;
    issuesByWordCount.set(count, (issuesByWordCount.get(count) || 0) + 1);
    totalWords += count;
  });

  const averageWordCount = totalCount > 0 ? Math.round(totalWords / totalCount) : 0;

  // Generate summary
  const summary = `
Gevonden: ${totalCount} <strong> ${totalCount === 1 ? 'element' : 'elementen'} met meer dan 4 woorden

Verdeling:
${Array.from(issuesByLocation.entries())
  .map(([loc, iss]) => `- ${loc}: ${iss.length}x`)
  .join('\n')}

Gemiddeld aantal woorden: ${averageWordCount}
  `.trim();

  return {
    summary,
    issuesByLocation,
    issuesByWordCount,
    totalIssues: totalCount,
    averageWordCount,
  };
}