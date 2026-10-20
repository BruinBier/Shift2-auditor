/**
 * Uitleg bij de W3C-techniekcodes (F65, G94, H37, ...) die op patronen staan.
 *
 * Patroon.technieken bewaart alleen de codes. Deze tabel geeft er een korte
 * Nederlandse betekenis en de link naar de W3C-pagina bij. Een code die hier
 * niet in staat blijft gewoon tekst. De regelbestanden in wcag-regels/ blijven
 * leidend; dit is alleen een leeshulp.
 */

export type Techniek = { code: string; soort: string; uitleg: string; url: string };

const MAP: Record<string, string> = {
  ARIA1: 'aria-describedby koppelt een beschrijving aan een bedienelement',
  ARIA2: 'aria-required geeft een verplicht veld aan',
  ARIA8: 'aria-label geeft een link een naam',
  ARIA17: 'Bij elkaar horende formuliervelden groeperen met een rol',
  ARIA21: 'aria-invalid geeft een fout in een veld aan',
  ARIA22: 'role="status" meldt een statusbericht zonder de focus te verplaatsen',
  C7: 'Tekst met CSS visueel verbergen, maar wel beschikbaar houden voor hulpsoftware',
  C9: 'Decoratieve afbeeldingen met CSS als achtergrond opnemen',
  C45: ':focus-visible laat de toetsenbordfocus zien',
  F2: 'informatie en relaties alleen via CSS, niet in de code',
  F3: 'betekenisvolle afbeelding alleen als CSS-achtergrond, zonder tekstalternatief',
  F13: 'tekstalternatief noemt niet wat alleen in kleurverschillen zit',
  F20: 'tekstalternatief niet bijgewerkt als de afbeelding verandert',
  F24: 'voorgrondkleur zonder achtergrondkleur ingesteld (of andersom)',
  F30: 'tekstalternatief is een bestandsnaam of plaatshouder',
  F34: 'spaties gebruikt om een tabel op te maken',
  F39: 'decoratieve afbeelding heeft een tekstalternatief dat niet leeg is',
  F43: 'structuurelementen alleen voor opmaak gebruikt',
  F46: 'th, caption of summary in een opmaaktabel',
  F48: 'pre-element gebruikt om een tabel op te maken',
  F54: 'alleen muisgebeurtenissen, geen toetsenbordbediening',
  F65: 'Een afbeelding zonder alt-attribuut',
  F71: 'letters die op tekst lijken, zonder tekstalternatief',
  F72: 'ASCII-art zonder tekstalternatief',
  F78: 'toetsenbordfocus niet zichtbaar',
  F87: 'betekenisvolle inhoud toegevoegd met :before of :after',
  F91: 'tabelkoppen niet juist gemarkeerd',
  F92: 'role="presentation" op inhoud die betekenis draagt',
  F96: 'toegankelijke naam bevat niet de zichtbare tekst',
  G14: 'Informatie die in kleur zit ook als tekst geven',
  G18: 'Tekstcontrast van minstens 4,5:1',
  G53: 'Doel van een link blijkt uit de linktekst plus de omringende zin',
  G73: 'Lange beschrijving op een aparte pagina bij een afbeelding',
  G74: 'Lange beschrijving in de tekst bij een afbeelding',
  G82: 'Tekstalternatief dat het doel van de afbeelding beschrijft',
  G83: 'Foutmelding in tekst bij ontbrekende verplichte velden',
  G91: 'Linktekst die het doel van de link beschrijft',
  G94: 'Geef niet-tekstuele inhoud een kort tekstalternatief dat hetzelfde doel dient als de inhoud zelf',
  G95: 'Kort tekstalternatief dat de inhoud beknopt beschrijft',
  G100: 'Tekstalternatief dat de gangbare of beschrijvende naam van de inhoud geeft',
  G117: 'Tekst gebruiken voor wat alleen in opmaak of spraakvariatie zit',
  G143: 'Tekstalternatief dat het doel van een CAPTCHA beschrijft',
  G144: 'Een CAPTCHA met een andere vorm als alternatief aanbieden',
  G202: 'Alle functionaliteit met het toetsenbord bedienbaar',
  G208: 'Zichtbare tekst van het label zit in de toegankelijke naam',
  H2: 'Afbeelding en tekst in dezelfde link combineren',
  H30: 'Linkafbeelding een tekstalternatief geven dat het doel beschrijft',
  H36: 'Afbeeldingsknop een tekstalternatief geven',
  H37: 'De HTML-uitwerking van G94: zet een alt-attribuut op het img-element',
  H40: 'Definitielijsten (dl) voor term en uitleg',
  H42: 'Koppen (h1 tot h6) voor kopteksten',
  H44: 'label-element bij een tekstveld',
  H48: 'Lijsten (ol, ul, dl) voor lijstachtige inhoud',
  H49: 'Semantische elementen voor nadruk, zoals em en strong',
  H51: 'Echte tabelmarkup voor gegevens in rijen en kolommen',
  H63: 'scope-attribuut koppelt tabelkoppen aan cellen',
  H64: 'title-attribuut op een frame of iframe',
  H67: 'alt="" en geen title bij een decoratieve afbeelding',
  H71: 'fieldset en legend om formuliervelden te groeperen',
  H77: 'Linkdoel uit linktekst plus het omringende lijstitem',
  H81: 'Linkdoel uit linktekst plus het bovenliggende lijstitem bij een geneste lijst',
  H90: 'Verplichte velden aangeven met label of title',
};

const MAP_PAD: Record<string, string> = {
  ARIA: 'aria', C: 'css', F: 'failures', G: 'general', H: 'html',
};

const SOORT: Record<string, string> = {
  ARIA: 'ARIA-techniek', C: 'CSS-techniek', F: 'Fout', G: 'Algemene techniek', H: 'HTML-techniek',
};

const CODE = /\b(ARIA|C|F|G|H)\d{1,3}\b/g;

/** De bekende codes in een stuk tekst, in volgorde van eerste voorkomen, zonder dubbelen. */
export function herkenTechnieken(tekst: string): Techniek[] {
  const gezien = new Set<string>();
  const uit: Techniek[] = [];
  for (const m of Array.from(tekst.matchAll(CODE))) {
    const code = m[0];
    const uitleg = MAP[code];
    if (!uitleg || gezien.has(code)) continue;
    gezien.add(code);
    const pad = MAP_PAD[m[1]];
    uit.push({ code, soort: SOORT[m[1]], uitleg: uitleg.charAt(0).toUpperCase() + uitleg.slice(1), url: `https://www.w3.org/WAI/WCAG22/Techniques/${pad}/${code}` });
  }
  return uit;
}

export type Situatie = { letter: string; wanneer: string; techniek: string };

/** W3C's indeling van de technieken bij 1.1.1 (Understanding SC 1.1.1, Sufficient Techniques). */
export const SITUATIES: Situatie[] = [
  { letter: 'A', wanneer: 'Een korte beschrijving kan hetzelfde doel dienen', techniek: 'G94, met onder andere H37' },
  { letter: 'B', wanneer: 'Een korte beschrijving is niet genoeg (grafiek, diagram)', techniek: 'G95, plus een lange beschrijving (G73, G74)' },
  { letter: 'C', wanneer: 'Een bedieningselement of invoer', techniek: 'G82, met onder andere H30, H36, H44' },
  { letter: 'D', wanneer: 'Tijdgebonden media, toets, zintuiglijke ervaring', techniek: 'G100 en andere' },
  { letter: 'E', wanneer: 'CAPTCHA', techniek: 'G143 en G144 samen' },
  { letter: 'F', wanneer: 'Moet door hulpsoftware genegeerd worden', techniek: 'C9 of H67' },
];

/** De situaties (A tot en met F) die in een stuk tekst genoemd worden, zonder dubbelen. */
export function herkenSituaties(tekst: string): Situatie[] {
  const letters = new Set(Array.from(tekst.matchAll(/\bSituatie ([A-F])\b/g)).map((m) => m[1]));
  return SITUATIES.filter((s) => letters.has(s.letter));
}
