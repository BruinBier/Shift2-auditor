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
  /**
   * Vlaggen waarmee de meting draait als de onderzoeker hem wil BEKIJKEN in plaats van
   * vastleggen.
   *
   * Dat is een andere handeling dan meten. Een meting is bewijs: die komt onder het oordeel
   * te staan en blijft daar. Bekijken is ernaar kijken — de gemarkeerde pagina komt open te
   * staan in de auditsessie, je scrollt erdoorheen, en er wordt niets vastgelegd. Zou dit
   * wél een regel opleveren, dan staat er straks vijf keer dezelfde meting onder een oordeel
   * omdat iemand vijf keer heeft gekeken.
   *
   * Leeg betekent: bij deze meting valt niets live te bekijken.
   */
  bekijkVlaggen?: Record<string, string>;
  /** Wat de bekijk-knop doet, in één zin, voor ernaast. */
  bekijkWat?: string;
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
    toegestaneVlaggen: ['full-page', 'selector', 'breedte', 'klik', 'keep-cookie-banner', 'zicht', 'voor'],
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
    /**
     * Contrast in een PDF, op de beeldpunten.
     *
     * Hoort hier omdat 1.4.3 bij een PDF jarenlang op `niet_te_bepalen` bleef staan: de regel
     * zei dat het niet te meten viel. Dat gold voor de methode die toen voorlag -- raden welke
     * beeldpunten tekst zijn -- en niet voor deze: de tekstkleur komt uit het document zelf,
     * alleen de achtergrond komt van het beeld.
     *
     * `vanafDeKaart` staat aan: er valt niets aan te wijzen vooraf, het commando loopt het
     * document zelf af.
     */
    commando: 'get-pdfcontrast',
    criteria: ['1.4.3', '1.4.11'],
    toegestaneVlaggen: ['paginas'],
    vanafDeKaart: true,
    wat: 'Meet het contrast van alle tekst in een PDF en geeft een band waar de tekst op een foto of verloop staat.',
    duurt: 'ongeveer een halve minuut per honderd paginas',
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
    toegestaneVlaggen: ['scope', 'klik', 'laat-staan'],
    vanafDeKaart: true,
    wat: 'Rekent per link de toegankelijke naam uit zoals een schermlezer die opbouwt, en meldt de links zonder naam, met alleen een title, of met een generieke tekst zonder context.',
    duurt: 'ongeveer 20 seconden',
    bekijkVlaggen: { 'laat-staan': 'true' },
    bekijkWat:
      'Zet de pagina open in je auditsessie met een kader om elke link: rood is opvallend, groen in orde, grijs gestippeld valt buiten dit criterium. De nummers zijn dezelfde als in het overzicht.',
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

/**
 * Wat de onderzoeker per pagina vaststelt, en welke criteria daarmee vervallen.
 *
 * Op het tabblad Steekproef staan twee vinkjes per pagina met drie standen. Staat er
 * een op "niet aanwezig" (`false`), dan zijn de criteria hieronder niet van toepassing
 * en worden ze zonder agent weggeschreven.
 *
 * Zes criteria stelden tot nu toe dezelfde vraag -- staat er video op deze pagina --
 * en beantwoordden hem elk apart. Op 13 september 2026 leverde dat zes woordelijk
 * bijna gelijke redenen op voor één vaststelling, op één pagina.
 *
 * Deze lijst staat hier en niet in de workflow, om dezelfde reden als de metingen
 * erboven: hij moet niet verzonnen of verkeerd opgegeven kunnen worden. Wie een
 * criterium toevoegt of weghaalt, doet dat hier en nergens anders.
 *
 * `null` betekent niet vastgesteld en is iets ANDERS dan `false`. Alleen `false`
 * sluit af; `null` en `true` laten de audit ongemoeid. Zonder dat onderscheid zou
 * elke sample die niemand heeft aangeraakt tien criteria overslaan.
 */
export interface Paginavinkje {
  /** Het veld op SampleItem. */
  veld: 'heeftBewegendBeeld' | 'heeftFormulier';
  /** Wat er niet op de pagina staat als het vinkje uit staat, voor in de reden. */
  wat: string;
  /** De criteria die daarmee niet van toepassing zijn. */
  criteria: string[];
}

export const PAGINAVINKJES: Paginavinkje[] = [
  {
    veld: 'heeftBewegendBeeld',
    // Breed: niet "een video-element", maar alles wat beweegt of klinkt. Een
    // informatiedragende GIF zit in geen enkel video-element en wordt door
    // `get-videos` niet gevonden, maar valt hier wel onder.
    wat: 'bewegend beeld: geen video, geen audio, geen animatie',
    // 1.2.4 en 1.4.2 staan hier NIET in: die vervallen sowieso, ook met dit vinkje aan.
    // Zie ALTIJD_NIET_AANWEZIG.
    criteria: ['1.2.1', '1.2.2', '1.2.3', '1.2.5', '2.1.4'],
  },
  {
    veld: 'heeftFormulier',
    wat: 'formulier',
    // 1.3.5 hoort hier ook bij: dat gaat over `autocomplete` op invoervelden, en zonder
    // formulier zijn er geen invoervelden. Stond er eerst niet in, waardoor een agent
    // dezelfde zoekopdracht (form, input, select, textarea) vijf keer deed in plaats van
    // vier.
    criteria: ['1.3.5', '3.3.1', '3.3.2', '3.3.3', '3.3.7'],
  },
];

/**
 * Criteria die op dit soort websites nooit van toepassing zijn, ongeacht de vinkjes.
 *
 * Dit is iets anders dan een vinkje. Een vinkje is een vaststelling van de onderzoeker
 * over ÉÉN pagina; deze lijst gaat over wat een gemeentelijke informatiesite naar zijn
 * aard niet doet. Staat er wél video op de pagina, dan blijft 1.2.4 toch niet van
 * toepassing: dat criterium eist ondertiteling bij een LIVE uitzending, en een opgenomen
 * film is geen uitzending.
 *
 * Het regelbestand van 1.2.4 schrijft voor dat je het bewust op `niet_aanwezig` zet en
 * niet met een zoektocht die niets kan vinden. Deze lijst maakt die keuze één keer, op
 * één plek, in plaats van dertig keer in een agent.
 */
export const ALTIJD_NIET_AANWEZIG: { code: string; reden: string }[] = [
  {
    code: '2.2.2',
    reden:
      'Dit criterium gaat over inhoud die uit zichzelf beweegt, schuift of bijwerkt en '+
      'langer dan vijf seconden doorgaat. Op deze websites staan geen carrousels, '+
      'tellers of doorlopende animaties: de pagina staat stil tot de bezoeker iets '+
      'doet. Vastgelegd voor dit soort websites, niet per pagina vastgesteld.',
  },
  {
    code: '1.4.2',
    reden:
      'Dit criterium gaat over geluid dat uit zichzelf begint en langer dan drie seconden ' +
      'doorgaat. Op deze websites start er nooit geluid vanzelf: er is geen media-element ' +
      'met autoplay, geen ingesloten speler die zichzelf start en geen geluidsscript. Ook ' +
      'een video op de pagina begint pas als de bezoeker erop klikt. Vastgelegd voor dit ' +
      'soort websites, niet per pagina vastgesteld.',
  },
  {
    code: '1.2.4',
    reden:
      'Dit criterium gaat over ondertiteling bij een LIVE uitzending. Deze website zendt ' +
      'niet live uit: er is geen raadsvergadering, livestream of webcam. Een opgenomen ' +
      'video maakt 1.2.4 niet van toepassing. Vastgelegd voor dit soort websites, niet ' +
      'per pagina vastgesteld.',
  },
]

/**
 * De criteria die voor deze sample vervallen, met de reden erbij.
 *
 * Geeft een lege lijst terug als er niets is vastgesteld -- dan verandert er niets
 * aan de audit.
 */
export function vervallenDoorVinkjes(sample: {
  heeftBewegendBeeld?: boolean | null;
  heeftFormulier?: boolean | null;
}): { code: string; reden: string }[] {
  const uit: { code: string; reden: string }[] = [...ALTIJD_NIET_AANWEZIG];
  for (const vinkje of PAGINAVINKJES) {
    if (sample[vinkje.veld] !== false) continue;
    for (const code of vinkje.criteria) {
      uit.push({
        code,
        reden: `Op deze pagina staat geen ${vinkje.wat}. Vastgesteld door de onderzoeker bij het samenstellen van de steekproef; het criterium is daarmee niet van toepassing.`,
      });
    }
  }
  return uit;
}

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
