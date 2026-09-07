/**
 * Wie een onderzoek kan uitvoeren of controleren.
 *
 * Een onderzoek wordt door een teamlid gedaan, of door een ander bureau
 * (bijvoorbeeld Cardan) terwijl wij controleren. Beide staan in dezelfde
 * keuzelijst "Onderzoeker": kies je een bureau, dan is het onderzoek extern.
 */

export const EIGEN_ORGANISATIE = 'Shift2';

/** Bureaus die een audit uitvoeren; het eerste is het eigen bureau. */
export const BUREAUS = [EIGEN_ORGANISATIE, 'Cardan'];

/** Teamleden die onderzoeken uitvoeren en controleren. */
export const TEAMLEDEN = ['Frits Karskens'];

/** Externe bureaus: alles behalve het eigen bureau. */
export const EXTERNE_BUREAUS = BUREAUS.filter((b) => b !== EIGEN_ORGANISATIE);

export function isExternBureau(naam: string | null | undefined): boolean {
  return Boolean(naam) && EXTERNE_BUREAUS.includes(naam as string);
}

/**
 * Keuzes voor een select, met de huidige waarde erbij als die niet meer in
 * de lijst staat. Zo blijft een oud onderzoek opslaanbaar zonder dat de
 * waarde stilzwijgend verandert.
 */
function metHuidige(lijst: string[], huidige?: string | null): string[] {
  return huidige && !lijst.includes(huidige) ? [...lijst, huidige] : lijst;
}

export function onderzoekerOpties(huidige?: string | null): string[] {
  return metHuidige([...TEAMLEDEN, ...EXTERNE_BUREAUS], huidige);
}

export function controleurOpties(huidige?: string | null): string[] {
  return metHuidige(TEAMLEDEN, huidige);
}
