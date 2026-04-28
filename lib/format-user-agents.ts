/**
 * Convert the free-text userAgents field into HTML.
 *
 * The field is typically entered as a single line with semicolon-separated
 * items (e.g. "Google Chrome 145 (primair); Mozilla Firefox 147; NVDA"),
 * but may also be entered as multiple lines or as already-formatted HTML.
 *
 * Behavior:
 * - If the text already contains list markup (<ul>/<ol>/<li>), it is
 *   returned as-is so editors can author HTML directly.
 * - Otherwise, the text is split on semicolons or newlines into individual
 *   items, empty items are dropped, and the result is wrapped in <ul><li>.
 * - If splitting yields a single non-empty item, a paragraph is returned
 *   instead of a one-item list.
 * - Returns an empty string when the input is empty/null/undefined.
 */
export function formatUserAgentsHtml(text: string | null | undefined): string {
  if (!text) return '';
  const raw = String(text).trim();
  if (!raw) return '';

  // If the editor already wrote a list, respect it.
  if (/<(ul|ol|li)\b/i.test(raw)) return raw;

  // Strip any other HTML before splitting so leftover <p>/<br> from rich
  // editors don't end up as visible items.
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ');

  const items = plain
    .split(/\s*[;\n\r]+\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (items.length === 0) return '';
  if (items.length === 1) {
    return `<p>${escapeHtml(items[0])}</p>`;
  }

  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
