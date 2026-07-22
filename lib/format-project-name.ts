/**
 * Format project name for display in reports
 * Converts domain names like "www.valkenswaard.nl" to "website Valkenswaard" or "formulieren Valkenswaard"
 * Also handles complex formats like "WCAG 2.2 AA - Deelonderzoek content - valkenswaard.nl"
 *
 * @param name - The project name or subject
 * @param type - The research type (e.g., "website", "formulieren", etc.)
 */
export function formatProjectName(name: string | null | undefined, type: string = 'website'): string {
  if (!name) return type;

  let formatted = name.trim();

  // If the string contains " - ", take the last part (usually the domain name)
  if (formatted.includes(' - ')) {
    const parts = formatted.split(' - ');
    formatted = parts[parts.length - 1].trim();
  }

  // Remove a leading research-type word so we don't end up with a double prefix
  // (e.g. title "website beverwijk.nl" + type "website" => "website Website beverwijk").
  // Strip both the actual type and the common variants.
  const typeWords = Array.from(
    new Set([type, 'website', 'formulieren', 'formulier', 'app', 'documenten', 'document'])
  ).filter(Boolean);
  for (const tw of typeWords) {
    const re = new RegExp(`^${tw}\\s+`, 'i');
    if (re.test(formatted)) {
      formatted = formatted.replace(re, '');
      break;
    }
  }

  // Remove common prefixes
  formatted = formatted.replace(/^(https?:\/\/)?(www\.)?/i, '');

  // Remove common TLDs and suffixes
  formatted = formatted.replace(/\.(nl|com|org|net|be|eu|gov|edu)$/i, '');

  // Capitalize first letter
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return `${type} ${formatted}`;
}