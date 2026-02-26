/**
 * Parse markdown content into intro and tabs based on horizontal rules (---) as separators
 *
 * Syntax in markdown:
 * Dit is de intro tekst die altijd zichtbaar is.
 *
 * ---
 *
 * ## Tab Naam 1
 *
 * Content voor de eerste tab
 *
 * ---
 *
 * ## Tab Naam 2
 *
 * Content voor de tweede tab
 *
 * Returns an object with optional intro and array of tabs with title and HTML content
 */

export interface Tab {
  title: string;
  content: string;
}

export interface ParsedContent {
  intro: string | null;
  tabs: Tab[];
}

export function parseMarkdownTabs(htmlContent: string | null): ParsedContent | null {
  if (!htmlContent) return null;

  // Split on <hr> or <hr /> tags (markdown --- becomes <hr> in HTML)
  const sections = htmlContent.split(/<hr\s*\/?>/i);

  // If no separators found, return null (no tabs, just regular content)
  if (sections.length === 1) {
    return null;
  }

  const tabs: Tab[] = [];
  let intro: string | null = null;

  sections.forEach((section, index) => {
    const trimmedSection = section.trim();
    if (!trimmedSection) return;

    // First section is ALWAYS the intro (can contain H2, H3, etc.)
    if (index === 0) {
      intro = trimmedSection;
      return;
    }

    // For all sections after the first, extract H2, H3, or H4 heading as accordion title
    const headingMatch = trimmedSection.match(/<h([2-4])[^>]*>(.*?)<\/h\1>/i);

    let title = `Sectie ${tabs.length + 1}`;
    let content = trimmedSection;

    if (headingMatch) {
      // Extract text from heading (remove any HTML tags inside)
      const headingHtml = headingMatch[2];
      title = headingHtml.replace(/<[^>]+>/g, '').trim();

      // Remove the heading from content (first occurrence only)
      content = trimmedSection.replace(headingMatch[0], '').trim();
    }

    tabs.push({
      title,
      content,
    });
  });

  return tabs.length > 0 ? { intro, tabs } : null;
}