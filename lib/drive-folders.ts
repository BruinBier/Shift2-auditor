/**
 * Google Drive folder mapping per domein.
 *
 * Parent folder "shift2 auditor" in root van fritskarskens@gmail.com:
 * https://drive.google.com/drive/folders/11GekUWK6HGUvo68TTKlJvv2eQSv0zyyZ
 *
 * Wanneer er een nieuw project wordt aangemaakt voor een nieuw domein,
 * vraag Claude om de Drive-map aan te maken en voeg de URL hier toe.
 */
export const DRIVE_FOLDERS: Record<string, string> = {
  'belcombinatie.nl': 'https://drive.google.com/drive/folders/1QlehdZ1sakirRsc1OOpjTWONNvA5wAl9',
  'blaricum.nl': 'https://drive.google.com/drive/folders/1tQN3sBRHAJFtBX-g7JpInYOl5yrfQPrq',
  'bunschoten.nl': 'https://drive.google.com/drive/folders/1DXjHWLHD2Rilm6FxMbVTq7RiNqSRoxx2',
  'eemnes.nl': 'https://drive.google.com/drive/folders/1EkA2XHQZtC9iTitjRjn4YKsdjX45-e7r',
  'grjw.nl': 'https://drive.google.com/drive/folders/1hy0kitWaMbFE7lqC1qUDqepxbYRvmHno',
  'heerlen.nl': 'https://drive.google.com/drive/folders/1r8AjLspQ-FQ2Kwi9MEJJCb7cAmXOM3Nx',
  'ijsselstein.nl': 'https://drive.google.com/drive/folders/1Tc7cVuZ3nYpyTmC9oJdRtxePDv9Fgj7x',
  'laren.nl': 'https://drive.google.com/drive/folders/1WFGwf0Z6lJzwv7E2VfHa0nK161HD8DOV',
  'mijnurk.nl': 'https://drive.google.com/drive/folders/1GFvQO8qKG-IyaU3iXQ3ZAS8ls30Qlnr0',
  'werkenvoorbel.nl': 'https://drive.google.com/drive/folders/15Lm2kPdxX34xCrI8L2zGIBM6A87I06yi',
  'wierden.nl': 'https://drive.google.com/drive/folders/1hJIMaomhwQwdMvRIh-ErgFEDejvTTSmf',
};

/**
 * Leidt een domein af uit een projecttitel.
 * Voorbeelden:
 *   "WCAG 2.2 AA - Deelonderzoek content - laren.nl"    → "laren.nl"
 *   "website bunschoten.nl"                              → "bunschoten.nl"
 *   "WCAG 2.2 AA - aanvullend deelonderzoek - mijn urk.nl" → "mijnurk.nl"
 *   "website Werkenvoorbel"                              → "werkenvoorbel.nl"
 */
export function deriveDomainFromTitle(title: string): string | null {
  if (!title) return null;

  // Direct match: iets.nl of iets.something.nl (geen spatie tussen "mijn" en "urk")
  const domainMatch = title.match(/([a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)/i);
  if (domainMatch) {
    const found = domainMatch[1].toLowerCase();
    if (DRIVE_FOLDERS[found]) return found;
    // Bijzonder geval: "mijn urk.nl" → "mijnurk.nl"
    const beforeDomain = title.toLowerCase().substring(0, title.toLowerCase().indexOf(found));
    if (/mijn\s+$/i.test(beforeDomain)) {
      const merged = 'mijn' + found;
      if (DRIVE_FOLDERS[merged]) return merged;
    }
  }

  // Fallback: woord-match zonder .nl
  const lower = title.toLowerCase();
  if (lower.includes('werkenvoorbel')) return 'werkenvoorbel.nl';

  return null;
}

/**
 * Haal de Drive-URL op voor een project op basis van de titel.
 */
export function getDriveFolderUrl(projectTitle: string): string | null {
  const domain = deriveDomainFromTitle(projectTitle);
  if (!domain) return null;
  return DRIVE_FOLDERS[domain] || null;
}
