/**
 * Het intakeblok: de gegevens waarmee een nieuwe opdracht binnenkomt.
 *
 * ChatGPT Work leest de opdrachtmail en de offerte en levert dit als JSON; de
 * onderzoeker plakt het op de intakepagina. Er is geen koppeling tussen Work en
 * deze tool -- zie docs/adr/0003-work-schrijft-niet-in-de-tool.md -- en dat is
 * precies wat het plakken veilig maakt: het voorstel bestaat alleen als tekst
 * tot de onderzoeker op aanmaken drukt.
 *
 * Wat hier NIET in hoort: een planning. Die ontstaat pas in het scopegesprek,
 * dus dateStart en dateEnd zijn geen velden maar een waarschuwing.
 */

/** Wat de intakepagina uit een blok kan overnemen. */
export type Intakeblok = {
  kenmerk?: string;
  url?: string;
  opdrachtgeverNaam?: string;
  opdrachtgeverKenmerk?: string;
  projectnummer?: string;
  contactnaam?: string;
  contactEmail?: string;
  accountmanager?: string;
  uitgevoerdDoor?: string;
  hasReinspection?: boolean;
  reinspectionWeeks?: number;
};

export type LeesResultaat =
  | { ok: true; blok: Intakeblok; waarschuwingen: string[] }
  | { ok: false; fout: string };

/** De velden die de intakepagina kent. Al het andere is een waarschuwing waard. */
const BEKEND = new Set([
  'kenmerk',
  'url',
  'opdrachtgeverNaam',
  'opdrachtgeverKenmerk',
  'projectnummer',
  'contactnaam',
  'contactEmail',
  'accountmanager',
  'uitgevoerdDoor',
  'hasReinspection',
  'reinspectionWeeks',
]);

/**
 * Velden die er plausibel uitzien maar niet in een intakeblok horen, met de
 * reden erbij. Zonder deze lijst verdwijnt zo'n veld stilzwijgend en denkt de
 * onderzoeker dat de planning is overgenomen.
 */
const NIET_HIER: Record<string, string> = {
  dateStart: 'de planning komt pas uit het scopegesprek',
  dateEnd: 'de planning komt pas uit het scopegesprek',
  plannedTime: 'de geplande tijd hoort bij de planning, niet bij de intake',
  researchType: 'het onderzoekstype staat vast; pas het achteraf aan als de offerte iets anders zegt',
  standard: 'de norm staat vast op WCAG 2.2; meld een afwijking in de offerte apart',
  level: 'het niveau staat vast op AA',
};

/** Haalt het JSON-object uit geplakte tekst, ook als er een codeblok of uitleg omheen staat. */
function pakJson(tekst: string): string | null {
  const schoon = tekst.trim();
  if (!schoon) return null;

  // Work levert het blok meestal in een codeblok met ```json ervoor.
  const codeblok = schoon.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeblok) return codeblok[1].trim();

  // Anders: het eerste accolade-paar. Work zet er vaak uitleg omheen, en die
  // uitleg is nuttig voor de onderzoeker maar geen JSON.
  const start = schoon.indexOf('{');
  const eind = schoon.lastIndexOf('}');
  if (start === -1 || eind === -1 || eind < start) return null;
  return schoon.slice(start, eind + 1);
}

/** Maakt van "16" of 16 een getal; alles wat geen getal is wordt genegeerd. */
function alsGetal(waarde: unknown): number | undefined {
  const n = typeof waarde === 'string' ? Number(waarde.trim()) : waarde;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
}

function alsTekst(waarde: unknown): string | undefined {
  if (typeof waarde !== 'string') return undefined;
  const schoon = waarde.trim();
  return schoon || undefined;
}

/**
 * Leest een geplakt intakeblok.
 *
 * Weigert alleen wat echt onbruikbaar is: geen JSON, of geen kenmerk en URL.
 * Al het andere komt terug als waarschuwing, want de onderzoeker ziet het
 * ingevulde formulier daarna alsnog en kan het corrigeren.
 */
export function leesIntakeblok(tekst: string): LeesResultaat {
  const json = pakJson(tekst);
  if (!json) {
    return { ok: false, fout: 'Geen blok gevonden. Plak de JSON die Work heeft geleverd.' };
  }

  let rauw: unknown;
  try {
    rauw = JSON.parse(json);
  } catch {
    return { ok: false, fout: 'Het blok is geen geldige JSON. Plak het opnieuw, compleet.' };
  }

  if (!rauw || typeof rauw !== 'object' || Array.isArray(rauw)) {
    return { ok: false, fout: 'Het blok moet een JSON-object zijn met velden als "kenmerk" en "url".' };
  }

  const bron = rauw as Record<string, unknown>;
  const waarschuwingen: string[] = [];

  for (const sleutel of Object.keys(bron)) {
    if (BEKEND.has(sleutel)) continue;
    const reden = NIET_HIER[sleutel];
    waarschuwingen.push(
      reden
        ? `"${sleutel}" is overgeslagen: ${reden}.`
        : `"${sleutel}" is niet overgenomen; dat veld kent de intake niet.`
    );
  }

  const blok: Intakeblok = {
    kenmerk: alsTekst(bron.kenmerk)?.toUpperCase(),
    url: alsTekst(bron.url),
    opdrachtgeverNaam: alsTekst(bron.opdrachtgeverNaam),
    opdrachtgeverKenmerk: alsTekst(bron.opdrachtgeverKenmerk)?.toUpperCase(),
    projectnummer: alsTekst(bron.projectnummer),
    contactnaam: alsTekst(bron.contactnaam),
    contactEmail: alsTekst(bron.contactEmail),
    accountmanager: alsTekst(bron.accountmanager),
    uitgevoerdDoor: alsTekst(bron.uitgevoerdDoor),
    hasReinspection: bron.hasReinspection === true ? true : undefined,
    reinspectionWeeks: alsGetal(bron.reinspectionWeeks),
  };

  if (!blok.kenmerk || !blok.url) {
    return {
      ok: false,
      fout: 'Het blok mist "kenmerk" of "url". Zonder die twee kan er geen onderzoek worden aangemaakt.',
    };
  }

  // Een hertesttermijn zonder hertest is een tegenstrijdigheid, geen aanvulling.
  if (blok.reinspectionWeeks && !blok.hasReinspection) {
    waarschuwingen.push(
      'Er staat een hertesttermijn in het blok, maar geen hertest. De termijn is genegeerd.'
    );
    blok.reinspectionWeeks = undefined;
  }

  return { ok: true, blok, waarschuwingen };
}
