/**
 * De indeling van de oefenmodus in categorieën ('Koppen', 'Valkuilen').
 *
 * De seed kent die indeling niet; ze staat alleen in de prototypes, als
 * `<section class="cat">` met een h2 en daarin `<article class="case" id="K1">`.
 * Bij de rapportsets staan valkuilen gewoon tussen de andere casussen, dus
 * `isValkuil` zegt niets over de categorie.
 */

/** Welk prototype bij welke oefenset hoort. */
export const PROTOTYPEN: Record<string, string> = {
  '111': 'oefenpagina-111.html',
  '131': 'oefenpagina-131.html',
  CON: 'oefenpagina-contact.html',
  HUW: 'oefenpagina-huwelijk.html',
  SWK: 'oefenpagina-swink.html',
};

export const ZONDER_CATEGORIE = 'Overig';

/** Casus-id ('131-K1') → categorie, uit de HTML van één prototype. */
export function categorieenUitPrototype(html: string, oefenset: string): Map<string, string> {
  const uit = new Map<string, string>();
  for (const sectie of html.split('<section class="cat"').slice(1)) {
    const kop = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(sectie)?.[1]?.replace(/<[^>]+>/g, '').trim();
    if (!kop) continue;
    const casus = /class="case" id="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = casus.exec(sectie)) !== null) uit.set(`${oefenset}-${m[1]}`, kop);
  }
  return uit;
}

/**
 * Groepeert casussen op categorie, in de volgorde waarin ze voor het eerst
 * voorkomen. De casussen komen al op volgorde binnen.
 */
export function groepeer<T extends { categorie: string | null }>(casussen: T[]): { titel: string; casussen: T[] }[] {
  const groepen: { titel: string; casussen: T[] }[] = [];
  for (const c of casussen) {
    const titel = c.categorie?.trim() || ZONDER_CATEGORIE;
    let groep = groepen.find((g) => g.titel === titel);
    if (!groep) {
      groep = { titel, casussen: [] };
      groepen.push(groep);
    }
    groep.casussen.push(c);
  }
  return groepen;
}
