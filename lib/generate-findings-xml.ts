/**
 * Helper functions to generate Word XML for findings section
 */

/**
 * Track hyperlink relationships for Word document
 */
export class HyperlinkManager {
  private relationships: Map<string, string> = new Map();
  private nextId: number = 100; // Start at high number to avoid conflicts

  /**
   * Get or create a relationship ID for a URL
   */
  getRelId(url: string): string {
    if (this.relationships.has(url)) {
      return this.relationships.get(url)!;
    }

    const relId = `rId${this.nextId++}`;
    this.relationships.set(url, relId);
    return relId;
  }

  /**
   * Generate relationship XML entries for all tracked URLs
   */
  generateRelationshipXml(): string {
    let xml = '';
    for (const [url, relId] of this.relationships.entries()) {
      xml += `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(url)}" TargetMode="External"/>`;
    }
    return xml;
  }

  /**
   * Get all relationships as array for insertion into rels file
   */
  getRelationships(): Array<{url: string, relId: string}> {
    return Array.from(this.relationships.entries()).map(([url, relId]) => ({url, relId}));
  }
}

interface Location {
  title: string;
  url: string;
}

interface Finding {
  number: number;
  findingCode: string;
  description: string;
  advice: string;
  impact: string | null;
  responsibility: string;
  locations: Location[];
}

interface CriterionWithFindings {
  code: string;
  title: string;
  level: string;
  description: string;
  understandingUrl: string;
  findings: Finding[];
}

/**
 * Generate a paragraph with text
 */
function generateParagraph(text: string, style?: string): string {
  const styleXml = style ? `<w:pStyle w:val="${style}"/>` : '';

  return `<w:p><w:pPr>${styleXml}</w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

/**
 * Convert a line of text with inline markdown links [text](url) to Word XML runs.
 * Returns an array of XML strings to be placed inside a <w:p>.
 */
function generateRunsWithLinks(text: string, hyperlinkManager?: HyperlinkManager): string {
  if (!hyperlinkManager) {
    return `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
  }
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(text)) !== null) {
    const before = text.substring(lastIndex, match.index);
    if (before) {
      result += `<w:r><w:t xml:space="preserve">${escapeXml(before)}</w:t></w:r>`;
    }
    const linkText = match[1];
    const linkUrl = match[2];
    const relId = hyperlinkManager.getRelId(linkUrl);
    result += `<w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t xml:space="preserve">${escapeXml(linkText)}</w:t></w:r></w:hyperlink>`;
    lastIndex = match.index + match[0].length;
  }
  const rest = text.substring(lastIndex);
  if (rest) {
    result += `<w:r><w:t xml:space="preserve">${escapeXml(rest)}</w:t></w:r>`;
  }
  return result;
}

/**
 * Generate a paragraph that may contain inline markdown links
 */
function generateParagraphWithLinks(text: string, hyperlinkManager?: HyperlinkManager, style?: string): string {
  const styleXml = style ? `<w:pStyle w:val="${style}"/>` : '';
  const runs = generateRunsWithLinks(text, hyperlinkManager);
  return `<w:p><w:pPr>${styleXml}</w:pPr>${runs}</w:p>`;
}

/**
 * Generate a bullet list item paragraph (uses numId=4 for visible bullets)
 */
function generateBulletItem(text: string, hyperlinkManager?: HyperlinkManager): string {
  const runs = generateRunsWithLinks(text, hyperlinkManager);
  return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr>${runs}</w:p>`;
}

/**
 * Convert plain-text content with markdown-like bullets (lines starting with "- ")
 * and inline markdown links [text](url) into Word XML.
 * Regular paragraphs for normal text, bullet list items for "- " lines.
 * Blank lines are preserved as paragraph breaks.
 */
function generateContentXml(text: string, hyperlinkManager?: HyperlinkManager): string {
  if (!text) return '';
  const lines = text.split('\n');
  let xml = '';
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const joined = buffer.join(' ').trim();
    if (joined) xml += generateParagraphWithLinks(joined, hyperlinkManager);
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '') {
      // blank line: flush accumulated paragraph
      flushBuffer();
      continue;
    }
    // Detect markdown bullet at start of line: "- " or "* "
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushBuffer();
      xml += generateBulletItem(bulletMatch[1], hyperlinkManager);
    } else {
      buffer.push(line);
    }
  }
  flushBuffer();
  return xml;
}

/**
 * Generate a heading
 */
function generateHeading(text: string, level: number): string {
  return `<w:p><w:pPr><w:pStyle w:val="Heading${level}"/></w:pPr><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

/**
 * Generate a paragraph with bold text
 */
function generateBoldParagraph(text: string): string {
  return `<w:p><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

/**
 * Generate a paragraph with mixed bold and regular text
 */
function generateMixedParagraph(boldText: string, normalText: string): string {
  return `<w:p><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>${escapeXml(boldText)}</w:t></w:r><w:r><w:t xml:space="preserve"> ${escapeXml(normalText)}</w:t></w:r></w:p>`;
}

/**
 * Generate a hyperlink paragraph with custom link text
 */
function generateHyperlinkParagraph(url: string, linkText?: string): string {
  // Use custom link text if provided, otherwise use the URL itself
  const text = linkText || url;
  return `<w:p><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strip HTML tags from text and decode HTML entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

/**
 * Generate XML for one finding
 */
function generateFindingXml(finding: Finding, hyperlinkManager: HyperlinkManager, findingLabel: string = 'Bevinding', criterionCode?: string, criterionTitle?: string): string {
  let xml = '';

  // Finding header as Kop4 (e.g., "Bevinding 1 (SC 1.3.3)" or "Opmerking 1 (SC 1.3.3)") - override bold to false for this specific heading
  // Add spacing before: before=720 (36pt) for MORE whitespace above the finding heading (space after gray box)
  const titleText = criterionCode
    ? `${escapeXml(findingLabel)} ${finding.number} (SC ${escapeXml(criterionCode)})`
    : `${escapeXml(findingLabel)} ${finding.number}`;
  xml += `<w:p><w:pPr><w:pStyle w:val="Kop4"/><w:spacing w:before="720"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:bCs w:val="0"/></w:rPr><w:t>${titleText}</w:t></w:r></w:p>`;

  // Locations (title and URL in same paragraph with line break)
  // If 2+ locations, render as bullet list
  if (finding.locations.length > 0) {
    if (finding.locations.length >= 2) {
      // Render as bullet list when there are 2 or more locations
      finding.locations.forEach(location => {
        if (location.url) {
          // Bullet list item with title (bold) on first line and clickable hyperlink URL on new line
          // Use numId="4" for bullet list (same as technologies list)
          const relId = hyperlinkManager.getRelId(location.url);
          xml += `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(location.title)}</w:t></w:r><w:r><w:br/></w:r><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(location.url)}</w:t></w:r></w:hyperlink></w:p>`;
        } else {
          // Bullet list item with just title if no URL (bold)
          xml += `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>${escapeXml(location.title)}</w:t></w:r></w:p>`;
        }
      });
    } else {
      // Render as regular paragraphs when there's only 1 location
      finding.locations.forEach(location => {
        if (location.url) {
          // Title (bold) on first line and clickable hyperlink URL on new line
          const relId = hyperlinkManager.getRelId(location.url);
          xml += `<w:p><w:pPr></w:pPr><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(location.title)}</w:t></w:r><w:r><w:br/></w:r><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(location.url)}</w:t></w:r></w:hyperlink></w:p>`;
        } else {
          // Just title if no URL (bold)
          xml += generateBoldParagraph(location.title);
        }
      });
    }
  }

  // Description (strip HTML tags, then split into paragraphs and bullet items)
  if (finding.description) {
    xml += generateContentXml(stripHtml(finding.description), hyperlinkManager);
  }

  // Advice as Kop5 heading with content on next paragraph(s) (strip HTML tags first)
  if (finding.advice) {
    xml += `<w:p><w:pPr><w:pStyle w:val="Kop5"/></w:pPr><w:r><w:t>Advies</w:t></w:r></w:p>`;
    xml += generateContentXml(stripHtml(finding.advice), hyperlinkManager);
  }

  return xml;
}

/**
 * Convert WCAG Understanding URL to Dutch translation URL
 */
function convertToNlUrl(url: string): string {
  return url.replace(/^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/(.+?)(?:\.html)?$/, (_match: string, slug: string) =>
    `https://www.w3.org/Translations/WCAG22-nl/#${slug}`
  );
}

/**
 * Generate XML for one criterion with its findings
 */
function generateCriterionWithFindingsXml(criterion: CriterionWithFindings, hyperlinkManager: HyperlinkManager, resultText: string = 'Voldoet niet', findingLabel: string = 'Bevinding'): string {
  let xml = '';

  // Criterion heading (e.g., "1.3.3 Zintuiglijke eigenschappen A") - use Kop3 for Dutch templates
  xml += `<w:p><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)} ${escapeXml(criterion.level)}</w:t></w:r></w:p>`;

  // Criterion description with clickable hyperlink on same paragraph but new line
  // Add spacing after this paragraph: after=240 (12pt) for more space before the gray "Resultaat" box
  if (criterion.description && criterion.understandingUrl) {
    // Combined paragraph with description, line break, and clickable hyperlink
    // Convert URL to Dutch translation
    const nlUrl = convertToNlUrl(criterion.understandingUrl);
    const relId = hyperlinkManager.getRelId(nlUrl);
    xml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(criterion.description)}</w:t></w:r><w:r><w:br/></w:r><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)}</w:t></w:r></w:hyperlink></w:p>`;
  } else if (criterion.description) {
    // Just description if no URL - also add spacing
    xml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(criterion.description)}</w:t></w:r></w:p>`;
  } else if (criterion.understandingUrl) {
    // Just clickable hyperlink if no description - also add spacing
    // Convert URL to Dutch translation
    const nlUrl = convertToNlUrl(criterion.understandingUrl);
    const relId = hyperlinkManager.getRelId(nlUrl);
    xml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:hyperlink r:id="${relId}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)}</w:t></w:r></w:hyperlink></w:p>`;
  }

  // Result with "Resultaat:" in bold and 15px font size (30 half-points) with light gray background and padding
  // Spacing: before=240 (12pt), after=240 (12pt) to keep gray box compact
  // Padding via spaces: add spaces at start and end for horizontal padding within gray box
  // Vertical positioning: add more line breaks above text to push it down slightly
  xml += `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="EEEEEE"/><w:spacing w:before="240" w:after="240"/></w:pPr><w:r><w:br/></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">  Resultaat:</w:t></w:r><w:r><w:rPr><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(resultText)}  </w:t></w:r><w:r><w:br/></w:r></w:p>`;

  // Each finding
  criterion.findings.forEach(finding => {
    xml += generateFindingXml(finding, hyperlinkManager, findingLabel, criterion.code, criterion.title);
  });

  return xml;
}

/**
 * Generate complete bevindingen or opmerkingen section XML
 */
export function generateFindingsSectionXml(
  criteria: CriterionWithFindings[],
  hyperlinkManager: HyperlinkManager,
  sectionTitle: string = 'Bevindingen',
  introText?: string,
  resultText: string = 'Voldoet niet',
  findingLabel: string = 'Bevinding'
): string {
  let xml = '';

  // Section heading (use Kop2 for Dutch templates) with page break
  xml += `<w:p><w:pPr><w:pageBreakBefore/><w:pStyle w:val="Kop2"/></w:pPr><w:r><w:t>${escapeXml(sectionTitle)}</w:t></w:r></w:p>`;

  // Intro paragraph (use default intro for Bevindingen if not provided)
  const defaultIntro = sectionTitle === 'Bevindingen'
    ? 'Hieronder worden de vastgestelde afwijkingen beschreven. Per bevinding is de locatie en een beschrijving van het probleem opgenomen, gevolgd door de impact op de gebruiker en een advies om de afwijking te verhelpen.'
    : 'De onderstaande opmerkingen leiden niet tot een afkeuring, maar bevatten suggesties die de toegankelijkheid of gebruiksvriendelijkheid verder kunnen verbeteren.';

  xml += generateParagraph(introText || defaultIntro);

  // Each criterion with findings
  criteria.forEach(criterion => {
    xml += generateCriterionWithFindingsXml(criterion, hyperlinkManager, resultText, findingLabel);
  });

  return xml;
}

export type { CriterionWithFindings, Finding, Location };