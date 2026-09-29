/**
 * Vraagcatalogus voor semantische signalen (steekproefselectie v2, fase 4).
 *
 * Een signaal is een ANTWOORD OP EEN KLEINE, GESLOTEN VRAAG -- nooit een besluit over de
 * steekproef. Niets in fase 4 leest deze signalen voor de selectie; wat ze betekenen voor
 * de steekproef wordt pas in fase 5 besloten, na beoordeling door de onderzoeker.
 *
 * Wat code al weet, wordt hier niet gevraagd. Er is dus geen vraag "staat er een video
 * op?" of "is er een formulier?": dat meten de inventarisatie en de browsermeting. Die
 * feiten gaan wel als INVOER mee, zodat de classifier er niet naar hoeft te raden.
 *
 * Zekerheid is hoog, middel of laag. Laag wordt ALTIJD als twijfel behandeld. Of middel
 * of hoog goed genoeg is, is nog niet besloten: dat volgt uit de beoordeling.
 *
 * Een vraag wijzigen (tekst, antwoorden, invoer) = versie ophogen. Oude antwoorden blijven
 * dan staan onder hun eigen versie en worden niet stil hergebruikt.
 */

export type Onderwerp = 'pagina' | 'document' | 'afbeelding' | 'pagina-in-cluster';
export type Zekerheid = 'hoog' | 'middel' | 'laag';

export interface Vraag {
  id: string;
  versie: number;
  onderwerp: Onderwerp;
  /** De vraag zoals de aanbieder hem krijgt. Eén beslisprobleem. */
  vraag: string;
  /** Gesloten antwoorden. Elke vraag heeft een twijfel-uitweg. */
  antwoorden: readonly string[];
  /** Toelichting per antwoord, zodat elke aanbieder dezelfde grenzen hanteert. */
  uitleg: Record<string, string>;
  /** Welke velden van de invoer de aanbieder krijgt (zie classifier.ts). */
  invoer: readonly string[];
  /** Wanneer de vraag gesteld wordt. */
  wanneer: string;
  /** Wanneer uitdrukkelijk NIET: omdat code het al weet, of omdat de vraag niet past. */
  nietWanneer: string;
  /**
   * Vanaf welke zekerheid het antwoord bruikbaar ZOU zijn. Voorlopig: niets is bruikbaar
   * zonder beoordeling. Laag is altijd twijfel; dit veld legt vast wat er na beoordeling
   * besloten wordt.
   */
  minimaleZekerheid: Zekerheid;
  /** Mag dit signaal in fase 5 de selectie beïnvloeden? Nog nergens: false. */
  gebruiktInSelectie: false;
}

export const VRAGEN = {
  paginarol: {
    id: 'paginarol',
    versie: 1,
    onderwerp: 'pagina',
    vraag: 'Welke rol heeft deze pagina voor de bezoeker? Kies de ene rol die het beste past.',
    antwoorden: ['homepage', 'overzicht', 'product_dienst', 'informatie', 'nieuws_publicatie', 'contact', 'formulier', 'evenement', 'vacature', 'overige', 'twijfel'],
    uitleg: {
      homepage: 'de startpagina van de site',
      overzicht: 'een pagina die vooral doorverwijst naar andere pagina\'s (tegels, lijst met links, zoekresultaat)',
      product_dienst: 'beschrijft één product of dienst van de organisatie: wat het is, voorwaarden, kosten, hoe aan te vragen',
      informatie: 'uitleg over een onderwerp, beleid of de organisatie, zonder dat het één product of dienst is',
      nieuws_publicatie: 'een nieuwsbericht, bekendmaking, besluit, verslag of andere publicatie met een datum',
      contact: 'contactgegevens, openingstijden, bereikbaarheid',
      formulier: 'de pagina IS een (stap van een) formulier om in te vullen',
      evenement: 'één evenement, bijeenkomst of activiteit op een datum',
      vacature: 'één vacature',
      overige: 'past in geen van de rollen hierboven',
      twijfel: 'de invoer is niet genoeg om te kiezen, of twee rollen passen even goed',
    },
    invoer: ['titel', 'pad', 'inhoudstype', 'componenten', 'koppen', 'tekstBegin', 'kenmerken'],
    wanneer: 'Voor elke HTML-kandidaat die in de beoordelingsset zit.',
    nietWanneer: 'Niet voor documenten. Niet als de pagina niet op te halen was.',
    minimaleZekerheid: 'hoog',
    gebruiktInSelectie: false,
  },
  dienstverlening: {
    id: 'dienstverlening',
    versie: 1,
    onderwerp: 'pagina',
    vraag:
      'Kan een inwoner, ondernemer of andere gebruiker via deze pagina iets aanvragen, regelen, melden, doorgeven, reserveren of starten? Een link naar een formulier of loket elders telt als "ja" als de pagina daar uitdrukkelijk voor bedoeld is.',
    antwoorden: ['ja', 'nee', 'twijfel'],
    uitleg: {
      ja: 'de pagina is bedoeld om een handeling te starten (aanvragen, melden, afspraak maken, doorgeven)',
      nee: 'de pagina informeert alleen; er is geen handeling die je vanaf hier start',
      twijfel: 'er staat een handeling, maar het is niet duidelijk of dat het doel van de pagina is',
    },
    invoer: ['titel', 'pad', 'inhoudstype', 'koppen', 'tekstBegin', 'actielinks', 'kenmerken'],
    wanneer: 'Voor elke HTML-kandidaat in de beoordelingsset.',
    nietWanneer: 'Niet voor documenten. Wordt alleen opgeslagen en getoond: GEEN invloed op selectie of volgorde.',
    minimaleZekerheid: 'hoog',
    gebruiktInSelectie: false,
  },
  pdfsoort: {
    id: 'pdfsoort',
    versie: 1,
    onderwerp: 'document',
    vraag: 'Wat voor soort document is deze PDF?',
    antwoorden: ['formulier', 'besluit', 'beleid', 'rapport', 'brochure_folder', 'verslag', 'publicatie', 'overige', 'twijfel'],
    uitleg: {
      formulier: 'om in te vullen of te ondertekenen en in te leveren',
      besluit: 'een besluit, verordening, regeling of beschikking',
      beleid: 'beleidsnota, visie, plan of programma',
      rapport: 'onderzoek, analyse, advies of evaluatie',
      brochure_folder: 'voorlichting voor inwoners: folder, brochure, kalender, infographic',
      verslag: 'verslag, notulen, jaarverslag of jaarrekening',
      publicatie: 'bekendmaking, krantenpagina of nieuwsbrief',
      overige: 'past in geen van de soorten hierboven (tekening, kaart, lijst)',
      twijfel: 'de invoer is niet genoeg om te kiezen',
    },
    invoer: ['bestandsnaam', 'pdfTitel', 'paginas', 'formuliervelden', 'tekstBegin', 'gevondenOp'],
    wanneer: 'Voor PDF\'s waarvan de schatting uit de bestandsnaam "overig" is, of waarvan de schatting en de gemeten kenmerken elkaar tegenspreken.',
    nietWanneer: 'Niet als code het al hard weet: een PDF met invulbare velden is een formulier (G32). Niet voor Word/Excel.',
    minimaleZekerheid: 'hoog',
    gebruiktInSelectie: false,
  },
  livestream: {
    id: 'livestream',
    versie: 1,
    onderwerp: 'pagina',
    vraag: 'Gaat het om een live-uitzending (of de opname daarvan van een vergadering of bijeenkomst die live werd uitgezonden), of om een gewone video?',
    antwoorden: ['ja', 'nee', 'twijfel'],
    uitleg: {
      ja: 'live-uitzending of webcam, of een uitzendpagina voor vergaderingen',
      nee: 'een gewone, vooraf gemaakte video',
      twijfel: 'niet uit de invoer op te maken',
    },
    invoer: ['titel', 'pad', 'koppen', 'tekstRondVideo', 'videoBronnen'],
    wanneer: 'Alleen als de inventarisatie of browsermeting een video op de pagina vond.',
    nietWanneer: 'Niet zonder vastgestelde video. Niet als de bron zelf al zegt dat het live is (dat is code).',
    minimaleZekerheid: 'hoog',
    gebruiktInSelectie: false,
  },
  beeldcategorie: {
    id: 'beeldcategorie',
    versie: 1,
    onderwerp: 'afbeelding',
    vraag: 'Wat voor soort afbeelding is dit, gezien de afbeelding zelf en de tekst eromheen?',
    antwoorden: ['decoratief', 'eenvoudige_foto_illustratie', 'complex_beeld', 'kaart_plattegrond', 'grafiek_diagram', 'infographic', 'tekst_in_afbeelding', 'twijfel'],
    uitleg: {
      decoratief: 'sfeer of versiering; geen informatie die de bezoeker nodig heeft',
      eenvoudige_foto_illustratie: 'een foto of illustratie die in een korte zin te beschrijven is',
      complex_beeld: 'schema, organogram, tekening of stroomschema: de informatie past niet in een kort tekstalternatief',
      kaart_plattegrond: 'een kaart of plattegrond als afbeelding',
      grafiek_diagram: 'grafiek of diagram met gegevens',
      infographic: 'combinatie van tekst, cijfers en beeld die samen informatie overbrengen',
      tekst_in_afbeelding: 'betekenisvolle tekst die in de afbeelding staat en daar niet uit de code te halen is',
      twijfel: 'niet te bepalen uit de afbeelding en de invoer',
    },
    invoer: ['afbeelding', 'alt', 'onderschrift', 'tekstRond', 'afmetingen', 'paginaTitel'],
    wanneer: 'Alleen voor redactionele afbeeldingen in de inhoud van een pagina (niet het logo, geen iconen, geen kaartjesafbeelding in een overzicht).',
    nietWanneer: 'Geen WCAG-oordeel: dit zegt niets over of het tekstalternatief voldoet.',
    minimaleZekerheid: 'hoog',
    gebruiktInSelectie: false,
  },
  afwijkend_in_cluster: {
    id: 'afwijkend_in_cluster',
    versie: 1,
    onderwerp: 'pagina-in-cluster',
    vraag:
      'Bevat deze pagina inhoud of functionaliteit die wezenlijk afwijkt van de andere getoonde pagina\'s in dit technische cluster? Kijk naar wat de pagina voor de bezoeker doet, niet naar het onderwerp.',
    antwoorden: ['ja', 'nee', 'twijfel'],
    uitleg: {
      ja: 'deze pagina doet iets anders dan de andere (bijvoorbeeld een publicatielijst tussen informatiepagina\'s, een video tussen tekstpagina\'s)',
      nee: 'zelfde soort pagina als de andere, alleen een ander onderwerp',
      twijfel: 'niet uit de invoer op te maken',
    },
    invoer: ['pagina', 'anderen'],
    wanneer: 'Alleen als proef, voor pagina\'s in een cluster van minstens 5 pagina\'s. De vergelijking gaat altijd tegen meerdere andere leden, nooit alleen tegen de representant.',
    nietWanneer: 'Telt NIET mee voor selectie (besluit fase 3/4).',
    minimaleZekerheid: 'hoog',
    gebruiktInSelectie: false,
  },
} as const satisfies Record<string, Vraag>;

export type VraagId = keyof typeof VRAGEN;

/** Laag is altijd twijfel. Het ruwe antwoord blijft bewaard; dit is wat getoond wordt. */
export function effectiefAntwoord(antwoord: string, zekerheid: Zekerheid): string {
  return zekerheid === 'laag' ? 'twijfel' : antwoord;
}

export function isGeldigAntwoord(vraagId: VraagId, antwoord: string): boolean {
  return (VRAGEN[vraagId].antwoorden as readonly string[]).includes(antwoord);
}
