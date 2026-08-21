/**
 * Welke meting bij welk succescriterium hoort — één bron, voor drie gebruikers.
 *
 * Deze koppeling hoort in de code en niet in wat een agent opgeeft: `get-reflow` bestáát
 * voor 1.4.10, `get-beweging` voor 2.2.2. Zo kan de toewijzing niet verzonnen of verkeerd
 * opgegeven worden.
 *
 * Drie plekken lezen dezelfde lijst, en dat is de reden dat hij hier staat en niet drie
 * keer:
 *
 *   1. het logboek van de CLI — welke criteria een gedraaide meting dient
 *   2. de kaart in "Waar sta ik" — welke meting je hier alsnog kunt starten
 *   3. de route die de meting uitvoert — wat er gedraaid mag worden en met welke vlaggen
 *
 * Die derde is een veiligheidsgrens: wat hier niet staat, draait niet. Voeg een commando
 * dus toe met de vlaggen die het kent, niet met een open lijst.
 *
 * Dit bestand mag niets importeren. Het wordt gelezen door de CLI (tsx), door een
 * API-route (Node) en door een component in de browser.
 */

export interface Meetopdracht {
  commando: string;
  /**
   * De criteria die deze meting bedient. Leeg betekent: dient elk criterium.
   *
   * `get-html` en `get-screenshot` hebben er geen. Dat is geen tekort maar een eerlijke
   * weergave: je haalt de pagina één keer op en gebruikt hem voor alles.
   */
  criteria: string[];
  /** Alle vlaggen die dit commando kent. Wat hier niet in staat, wordt geweigerd. */
  toegestaneVlaggen: string[];
  /**
   * Waarmee de meting draait als de onderzoeker hem vanaf de kaart start.
   *
   * Bewust niet leeg bij `get-reflow`: 320 pixels is de breedte uit het criterium, niet
   * een voorkeur. Wie iets anders wil, draait het commando zelf.
   */
  vlaggen?: Record<string, string>;
  /**
   * Is deze meting vanaf de kaart te starten met één klik?
   *
   * Nee bij alles wat eerst een keuze van de onderzoeker vraagt. `get-pixelcontrast` moet
   * weten wélk element het meet; een knop die dat zelf verzint, meet het verkeerde.
   */
  vanafDeKaart: boolean;
  /** Wat de meting doet, in één zin, voor naast de knop. */
  wat: string;
  /** Waarom die vraag niet met een klik te beantwoorden is. Alleen als vanafDeKaart uit staat. */
  waaromNiet?: string;
  /** Hoe lang het ongeveer duurt. Staat op de knop terwijl hij draait. */
  duurt?: string;
}

export const METINGEN: Meetopdracht[] = [
  {
    commando: 'get-html',
    criteria: [],
    toegestaneVlaggen: ['text', 'full'],
    vanafDeKaart: false,
    wat: 'Haalt de pagina op in een echte browser, zodat de JavaScript van de site heeft gedraaid.',
    waaromNiet: 'Dit dient elk criterium en hoort bij het begin van de audit, niet bij één kaart.',
  },
  {
    commando: 'get-screenshot',
    criteria: [],
    toegestaneVlaggen: ['full-page', 'selector', 'breedte', 'klik', 'keep-cookie-banner'],
    vanafDeKaart: false,
    wat: 'Maakt een opname van de pagina of van één element.',
    waaromNiet: 'Een opname van één element hoort bij één criterium; welk element dat is, moet je aanwijzen.',
  },
  {
    commando: 'get-videosporen',
    criteria: ['1.2.3', '1.2.5'],
    toegestaneVlaggen: ['max', 'klik'],
    vanafDeKaart: true,
    wat: 'Opent elke video op zijn eigen pagina en leest de sporen uit: ondertiteling, audiosporen, audiodescriptie. Legt drie beeldjes vast, want open ondertiteling staat in geen enkele gegevensbron.',
    duurt: 'een minuut of langer per video',
  },
  {
    commando: 'get-leesvolgorde',
    criteria: ['1.3.2'],
    toegestaneVlaggen: ['zonder-css'],
    vlaggen: { 'zonder-css': 'true' },
    vanafDeKaart: true,
    wat: 'Zet de volgorde in de code naast de volgorde op het scherm en meldt waar de opmaak die omkeert.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-contrast',
    criteria: ['1.4.3', '1.4.11'],
    toegestaneVlaggen: ['selector', 'klik'],
    vanafDeKaart: false,
    wat: 'Meet het contrast van tekst tegen zijn achtergrond.',
    waaromNiet: 'Vraagt welk element je meet. Meet op het element dat de tekst zelf bevat, niet op een omhulsel.',
  },
  {
    commando: 'get-pixelcontrast',
    criteria: ['1.4.11'],
    toegestaneVlaggen: ['selector', 'breedte', 'marge', 'klik'],
    vanafDeKaart: false,
    wat: 'Leest de werkelijke beeldpunten rond een element en geeft de slechtste verhouding per zijde.',
    waaromNiet: 'Vraagt welk element je meet.',
  },
  {
    commando: 'get-nietteksten',
    criteria: ['1.4.11'],
    toegestaneVlaggen: ['klik', 'max', 'marge'],
    vanafDeKaart: true,
    wat: 'Zoekt zelf op welke onderdelen onder dit criterium vallen en meet ze in rust en met de muis erop.',
    duurt: 'een minuut of langer',
  },
  {
    commando: 'get-reflow',
    criteria: ['1.4.10'],
    toegestaneVlaggen: ['breedte', 'hoogte'],
    vlaggen: { breedte: '320' },
    vanafDeKaart: true,
    wat: 'Zet het venster op 320 pixels en kijkt of er horizontaal gescrold moet worden.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-consistentie',
    criteria: ['3.2.4'],
    toegestaneVlaggen: ['max', 'scope'],
    vanafDeKaart: true,
    wat: 'Legt de paginas van de steekproef naast elkaar en zoekt onderdelen die op de ene pagina anders heten dan op de andere. Dit criterium gaat over een set paginas; aan een pagina is consistentie niet te zien.',
    duurt: 'enkele minuten, afhankelijk van het aantal paginas',
  },
  {
    commando: 'get-labelinnaam',
    criteria: ['2.5.3'],
    toegestaneVlaggen: ['scope', 'klik'],
    vanafDeKaart: true,
    wat: 'Vergelijkt per bedieningselement de zichtbare tekst met de toegankelijke naam -- de kern van dit criterium.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-links',
    criteria: ['2.4.4'],
    toegestaneVlaggen: ['scope', 'klik'],
    vanafDeKaart: true,
    wat: 'Rekent per link de toegankelijke naam uit zoals een schermlezer die opbouwt, en meldt de links zonder naam, met alleen een title, of met een generieke tekst zonder context.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-toetsenbordval',
    criteria: ['2.1.2'],
    toegestaneVlaggen: ['scope', 'klik', 'typ-in', 'typ', 'achteruit', 'max'],
    vanafDeKaart: true,
    wat: 'Drukt Tab, leest na elke druk uit welk element focus heeft, en herkent een val doordat de focus het gebied niet verlaat.',
    duurt: 'ongeveer 30 seconden',
  },
  {
    commando: 'get-videos',
    criteria: ['2.1.4'],
    toegestaneVlaggen: ['scope', 'doorloop'],
    vanafDeKaart: true,
    wat: 'Zoekt de ingesloten videospelers en leest per speler de insluitcode.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-sneltoetsen',
    criteria: ['2.1.4'],
    toegestaneVlaggen: ['toetsen', 'in'],
    vanafDeKaart: false,
    wat: 'Drukt losse toetsen in en kijkt of er iets gebeurt.',
    waaromNiet: 'Dit is de uitzondering, alleen met een concrete aanleiding. Begin bij get-videos.',
  },
  {
    commando: 'get-flitsen',
    criteria: ['2.3.1'],
    toegestaneVlaggen: ['seconden', 'klik'],
    vanafDeKaart: true,
    wat: 'Leest de beeldjes mee die de browser tekent en telt de helderheidssprongen, om te zien of er iets flitst.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-beweging',
    criteria: ['2.2.2'],
    toegestaneVlaggen: ['seconden', 'vanaf', 'klik'],
    vanafDeKaart: true,
    wat: 'Laat de pagina staan en vergelijkt drie opnamen, om te zien of er iets uit zichzelf beweegt of zich bijwerkt.',
    duurt: 'ongeveer 15 seconden',
  },
];

/**
 * Criteria waarvan het oordeel over de héle steekproef gaat, niet over één pagina.
 *
 * 3.2.4 vraagt of hetzelfde onderdeel op verschillende pagina's hetzelfde heet. Aan één
 * pagina is dat niet te zien; een oordeel per pagina is daar geen onnauwkeurigheid maar een
 * categoriefout. Zulke criteria worden op het homepage-sample vastgelegd, net als de
 * bevindingen over header en footer, en op de andere samples staan ze op `niet_aanwezig`
 * met een verwijzing daarheen.
 *
 * De kaart heeft deze lijst nodig om te kunnen zeggen wat de knop doet. Zonder dit staat er
 * "3.2.4 · Home" boven en leest "In orde" als een uitspraak over de homepage, terwijl je een
 * conclusie over zestien pagina's bevestigt.
 */
export const SITEBREED_BEOORDEELD = ['3.2.4'];

/** Wordt dit criterium over de hele steekproef beoordeeld? */
export function isSitebreed(code: string): boolean {
  return SITEBREED_BEOORDEELD.includes(code);
}

/** De meting bij een commando, of niets als het commando niet bestaat. */
export function meetopdracht(commando: string): Meetopdracht | undefined {
  return METINGEN.find((m) => m.commando === commando);
}

/** Welke criteria een commando dient. Zo leest het logboek deze lijst. */
export const CRITERIA_PER_COMMANDO: Record<string, string[]> = Object.fromEntries(
  METINGEN.filter((m) => m.criteria.length).map((m) => [m.commando, m.criteria])
);

/** De metingen die dit criterium bedienen, in de volgorde van de lijst hierboven. */
export function metingenVoorCriterium(code: string): Meetopdracht[] {
  return METINGEN.filter((m) => m.criteria.includes(code));
}

/** Wat je voor dit criterium met één klik kunt starten. */
export function meetbaarVanafDeKaart(code: string): Meetopdracht[] {
  return metingenVoorCriterium(code).filter((m) => m.vanafDeKaart);
}

/**
 * De aanroep zoals hij op de kaart staat: om te lezen en te kopiëren.
 *
 * Deze tekst wordt NOOIT uitgevoerd. De route krijgt de commandonaam en de losse
 * argumenten; zou zij deze regel naar een shell sturen, dan kan iedereen die iets in de
 * database krijgt code op deze machine draaien.
 */
export function leesbareAanroep(commando: string, url: string, vlaggen: Record<string, string> = {}) {
  const staart = Object.entries(vlaggen)
    .map(([k, v]) => (v === 'true' ? ` --${k}` : ` --${k}=${v}`))
    .join('');
  return `npm run cli -- ${commando} ${url}${staart}`.trim();
}
