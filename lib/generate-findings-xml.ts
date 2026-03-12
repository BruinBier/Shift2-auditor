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
  impact: string;
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
 * Generate XML for one finding
 */
function generateFindingXml(finding: Finding, findingLabel: string = 'Bevinding'): string {
  let xml = '';

  // Finding header as Kop4 (e.g., "Bevinding 1" or "Opmerking 1") - override bold to false for this specific heading
  xml += `<w:p><w:pPr><w:pStyle w:val="Kop4"/></w:pPr><w:r><w:rPr><w:b w:val="0"/><w:bCs w:val="0"/></w:rPr><w:t>${escapeXml(findingLabel)} ${finding.number}</w:t></w:r></w:p>`;

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

  // Description
  if (finding.description) {
    xml += generateParagraph(finding.description);
  }

  // Advice as Kop5 heading with text on next paragraph
  if (finding.advice) {
    xml += `<w:p><w:pPr><w:pStyle w:val="Kop5"/></w:pPr><w:r><w:t>Advies</w:t></w:r></w:p>`;
    xml += generateParagraph(finding.advice);
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
  if (criterion.description && criterion.understandingUrl) {
    // Combined paragraph with description, line break, and link
    xml += `<w:p><w:pPr></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(criterion.description)}</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t>${escapeXml(criterion.code)} ${escapeXml(criterion.title)}</w:t></w:r></w:p>`;
  } else if (criterion.description) {
    // Just description if no URL
    xml += generateParagraph(criterion.description);
  } else if (criterion.understandingUrl) {
    // Just link if no description
    xml += generateHyperlinkParagraph(criterion.understandingUrl, `${criterion.code} ${criterion.title}`);
  }

  // Result with "Resultaat:" in bold and 15px font size (30 half-points) with light gray background and padding
  // Increased spacing: before=240 (12pt), after=480 (24pt) for more whitespace around gray box
  // Padding via spaces: add spaces at start and end for horizontal padding within gray box
  // Vertical padding via line height: line=480 (24pt) for more vertical space inside gray box
  xml += `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="EEEEEE"/><w:spacing w:before="240" w:after="480" w:line="480" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr><w:b/><w:bCs/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve">  Resultaat:</w:t></w:r><w:r><w:rPr><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(resultText)}  </w:t></w:r></w:p>`;

  // Each finding
  criterion.findings.forEach(finding => {
    xml += generateFindingXml(finding, findingLabel);
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