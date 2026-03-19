/**
 * Helper functions to generate Word XML for findings section
 */

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
function generateFindingXml(finding: Finding, findingLabel: string = 'Bevinding', criterionCode?: string, criterionTitle?: string): string {
  let xml = '';

  // Finding header as Kop4 (e.g., "Bevinding 1 (SC 1.3.3)" or "Opmerking 1 (SC 1.3.3)") - override bold to false for this specific heading
  // Add spacing before: before=720 (36pt) for MORE whitespace above the finding heading (space after gray box)
  const titleText = criterionCode
    ? `${escapeXml(findingLabel)} ${finding.number} (SC ${escapeXml(criterionCode)})`
    : `${escapeXml(findingLabel)} ${finding.number}`;
  xml += `<w:p><w:pPr><w:pStyle w:val="Kop4"/><w:spacing w:before="720"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:bCs w:val="0"/></w:rPr><w:t>${titleText}</w:t></w:r></w:p>`;

  // Locations (title and URL in same paragraph with line break)
  if (finding.locations.length > 0) {
    finding.locations.forEach(location => {
      if (location.url) {
        // Title and URL in same paragraph with line break
        xml += `<w:p><w:pPr></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(location.title)}</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(location.url)}</w:t></w:r></w:p>`;
      } else {
        // Just title if no URL
        xml += generateParagraph(location.title);
      }
    });
  }

  // Description (strip HTML tags first)
  if (finding.description) {
    xml += generateParagraph(stripHtml(finding.description));
  }

  // Advice as Kop5 heading with text on next paragraph (strip HTML tags first)
  if (finding.advice) {
    xml += `<w:p><w:pPr><w:pStyle w:val="Kop5"/></w:pPr><w:r><w:t>Advies</w:t></w:r></w:p>`;
    xml += generateParagraph(stripHtml(finding.advice));
  }

  return xml;
}

/**
 * Generate XML for one criterion with its findings
 */
function generateCriterionWithFindingsXml(criterion: CriterionWithFindings, resultText: string = 'Voldoet niet', findingLabel: string = 'Bevinding'): string {
  let xml = '';

  // Criterion heading (e.g., "1.3.3 Zintuiglijke eigenschappen A") - use Kop3 for Dutch templates
  xml += `<w:p><w:pPr><w:pStyle w:val="Kop3"/></w:pPr><w:r><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)} ${escapeXml(criterion.level)}</w:t></w:r></w:p>`;

  // Criterion description with link on same paragraph but new line
  // Add spacing after this paragraph: after=240 (12pt) for more space before the gray "Resultaat" box
  if (criterion.description && criterion.understandingUrl) {
    // Combined paragraph with description, line break, and link
    xml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(criterion.description)}</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)}</w:t></w:r></w:p>`;
  } else if (criterion.description) {
    // Just description if no URL - also add spacing
    xml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(criterion.description)}</w:t></w:r></w:p>`;
  } else if (criterion.understandingUrl) {
    // Just link if no description - also add spacing
    xml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)}</w:t></w:r></w:p>`;
  }

  // Result with "Resultaat:" in bold and 15px font size (30 half-points) with light gray background and padding
  // Spacing: before=240 (12pt), after=240 (12pt) to keep gray box compact
  // Padding via spaces: add spaces at start and end for horizontal padding within gray box
  // Vertical positioning: add more line breaks above text to push it down slightly
  xml += `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="EEEEEE"/><w:spacing w:before="240" w:after="240"/></w:pPr><w:r><w:br/></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">  Resultaat:</w:t></w:r><w:r><w:rPr><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(resultText)}  </w:t></w:r><w:r><w:br/></w:r></w:p>`;

  // Each finding
  criterion.findings.forEach(finding => {
    xml += generateFindingXml(finding, findingLabel, criterion.code, criterion.title);
  });

  return xml;
}

/**
 * Generate complete bevindingen or opmerkingen section XML
 */
export function generateFindingsSectionXml(
  criteria: CriterionWithFindings[],
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
    : 'Hieronder worden de opmerkingen beschreven. Per opmerking is de locatie en een beschrijving van het probleem opgenomen, gevolgd door een advies.';

  xml += generateParagraph(introText || defaultIntro);

  // Each criterion with findings
  criteria.forEach(criterion => {
    xml += generateCriterionWithFindingsXml(criterion, resultText, findingLabel);
  });

  return xml;
}

export type { CriterionWithFindings, Finding, Location };