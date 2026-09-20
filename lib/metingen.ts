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
  /**
   * Hoe de meting heet in een lopende zin, zonder het commando.
   *
   * Voor plekken waar de naam tussen gewone tekst staat en `get-html` als jargon leest --
   * de auditsessie-badge op de kaart bijvoorbeeld, die meldt wélke meting headless is
   * gedaan. In het meetlogboek eronder staat het commando zelf nog steeds voluit, dus de
   * twee zijn aan elkaar te koppelen.
   */
  naam: string;
  /**
   * De handeling, als voltooid deelwoord: "getabd", "opgehaald", "gemeten".
   *
   * Voor de badge op de kaart, die vertelt waarmee er is getest: "in auditsessie getabt"
   * zegt meer dan "auditsessie". Een zelfstandig naamwoord kan dat niet -- "de
   * toetsenbordval" is wat er gemeten is, niet wat er gedaan is.
   */
  handeling: string;
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
    naam: 'de HTML',
    handeling: 'opgehaald',
    criteria: [],
    toegestaneVlaggen: ['text', 'full'],
    vanafDeKaart: false,
    wat: 'Haalt de pagina op in een echte browser, zodat de JavaScript van de site heeft gedraaid.',
    waaromNiet: 'Dit dient elk criterium en hoort bij het begin van de audit, niet bij één kaart.',
  },
  {
    commando: 'get-screenshot',
    naam: 'de schermafdruk',
    handeling: 'vastgelegd',
    criteria: [],
    toegestaneVlaggen: ['full-page', 'selector', 'breedte', 'klik', 'keep-cookie-banner', 'zicht', 'voor'],
    vanafDeKaart: false,
    wat: 'Maakt een opname van de pagina of van één element.',
    waaromNiet: 'Een opname van één element hoort bij één criterium; welk element dat is, moet je aanwijzen.',
  },
  {
    commando: 'get-videosporen',
    naam: 'de sporen van elke videospeler',
    handeling: 'uitgelezen',
    criteria: ['1.2.3', '1.2.5'],
    toegestaneVlaggen: ['max', 'klik'],
    vanafDeKaart: true,
    wat: 'Opent elke video op zijn eigen pagina en leest de sporen uit: ondertiteling, audiosporen, audiodescriptie. Legt drie beeldjes vast, want open ondertiteling staat in geen enkele gegevensbron.',
    duurt: 'een minuut of langer per video',
  },
  {
    commando: 'get-leesvolgorde',
    naam: 'code- en kijkvolgorde naast elkaar',
    handeling: 'gemeten',
    criteria: ['1.3.2'],
    toegestaneVlaggen: ['zonder-css'],
    vlaggen: { 'zonder-css': 'true' },
    vanafDeKaart: true,
    wat: 'Zet de volgorde in de code naast de volgorde op het scherm en meldt waar de opmaak die omkeert.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-contrast',
    naam: 'contrast van tekst gemeten',
    handeling: 'gemeten',
    criteria: ['1.4.3', '1.4.11'],
    toegestaneVlaggen: ['selector', 'klik'],
    vanafDeKaart: false,
    wat: 'Meet het contrast van tekst tegen zijn achtergrond.',
    waaromNiet: 'Vraagt welk element je meet. Meet op het element dat de tekst zelf bevat, niet op een omhulsel.',
  },
  {
    commando: 'get-pixelcontrast',
    naam: 'randcontrast op de beeldpunten',
    handeling: 'gemeten',
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
    naam: 'contrast in de PDF gemeten',
    handeling: 'gemeten',
    criteria: ['1.4.3', '1.4.11'],
    toegestaneVlaggen: ['paginas'],
    vanafDeKaart: true,
    wat: 'Meet het contrast van alle tekst in een PDF en geeft een band waar de tekst op een foto of verloop staat.',
    duurt: 'ongeveer een halve minuut per honderd paginas',
  },
  {
    /**
     * Consistente identificatie binnen één PDF (SC 3.2.4).
     *
     * `get-consistentie` staat hierboven ook voor 3.2.4, maar dat legt de pagina's van de
     * STEEKPROEF naast elkaar: de vraag van de website. Een PDF is een eigen set, en de
     * knop op een PDF-kaart hoorde dus iets anders te doen dan de knop op een webkaart.
     */
    commando: 'get-pdfconsistentie',
    naam: 'onderdelen binnen de PDF vergeleken',
    handeling: 'vergeleken',
    criteria: ['3.2.4'],
    toegestaneVlaggen: [],
    vanafDeKaart: true,
    wat: 'Vergelijkt binnen het document: koppelingen met hetzelfde doel maar een andere tekst, en of dezelfde soort kop steeds hetzelfde niveau krijgt.',
    duurt: 'enkele seconden',
  },
  {
    /**
     * De leesvolgorde van een PDF, uit de tagboom.
     *
     * `get-leesvolgorde` staat hierboven ook voor 1.3.2, maar dat opent een pagina in een
     * browser en legt de CSS-positie naast de code-volgorde. Een PDF heeft geen van beide.
     * Daardoor stond 1.3.2 op een PDF op "niet gemeten" met een knop die niets kon
     * opleveren. Twee commando's voor hetzelfde criterium dus, elk voor een ander soort
     * document; de kaart biedt ze allebei aan en de agent kiest wat past.
     */
    commando: 'get-pdfleesvolgorde',
    naam: 'de tagboom in leesvolgorde',
    handeling: 'gemeten',
    criteria: ['1.3.2'],
    toegestaneVlaggen: [],
    vanafDeKaart: true,
    wat: 'Loopt de tagboom in leesvolgorde af en meldt waar hulpsoftware terugspringt naar een eerdere pagina.',
    duurt: 'enkele seconden',
  },
  {
    /**
     * Wat in een PDF exact vast te stellen is, in één keer.
     *
     * De criterialijst is lang omdat één zoekactie ze allemaal bedient: geen /Sound,
     * /Movie, /RichMedia of /Screen betekent geen video én geen geluid én niets dat kan
     * flitsen; een lege /AcroForm /Fields betekent geen invoervelden én geen
     * toetsenbordval én geen aanwijsgebied. Dat zijn geen aannames over "dit soort
     * documenten" maar uitputtende zoekacties: de verzameling manieren waarop een PDF dit
     * kan doen is eindig.
     *
     * Hier staan alleen de criteria waarvan het commando het antwoord HARD geeft. De
     * tellingen die het daarnaast levert (getagde pagina's, figuren zonder alt, links)
     * dienen 1.1.1, 1.3.1, 1.3.2 en 2.4.4, maar vellen daar geen oordeel -- die zou een
     * knop "gemeten" geven aan een vraag die een mens moet wegen.
     */
    commando: 'get-pdfstructuur',
    naam: 'de PDF-structuur uitgelezen',
    handeling: 'uitgelezen',
    criteria: [
      '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '2.1.4',
      '1.4.2', '2.2.2', '2.3.1',
      '1.3.5', '3.3.1', '3.3.2', '3.3.3', '3.3.7', '2.1.2', '2.5.3', '2.5.8',
      '3.1.1', '2.4.2', '1.4.10',
    ],
    toegestaneVlaggen: [],
    vanafDeKaart: true,
    wat: 'Leest in één keer uit wat in een PDF exact vast te stellen is: media, scripts, formuliervelden, taal, titel en tagstructuur.',
    duurt: 'enkele seconden',
  },
  {
    commando: 'get-nietteksten',
    naam: 'pictogrammen en veldranden gemeten',
    handeling: 'gemeten',
    criteria: ['1.4.11'],
    toegestaneVlaggen: ['klik', 'max', 'marge'],
    vanafDeKaart: true,
    wat: 'Zoekt zelf op welke onderdelen onder dit criterium vallen en meet ze in rust en met de muis erop.',
    duurt: 'een minuut of langer',
  },
  {
    commando: 'get-reflow',
    naam: 'de pagina op 320 pixels',
    handeling: 'gemeten',
    criteria: ['1.4.10'],
    toegestaneVlaggen: ['breedte', 'hoogte'],
    vlaggen: { breedte: '320' },
    vanafDeKaart: true,
    wat: 'Zet het venster op 320 pixels en kijkt of er horizontaal gescrold moet worden.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-consistentie',
    naam: 'de paginas naast elkaar',
    handeling: 'vergeleken',
    criteria: ['3.2.4'],
    toegestaneVlaggen: ['max', 'scope'],
    vanafDeKaart: true,
    wat: 'Legt de paginas van de steekproef naast elkaar en zoekt onderdelen die op de ene pagina anders heten dan op de andere. Dit criterium gaat over een set paginas; aan een pagina is consistentie niet te zien.',
    duurt: 'enkele minuten, afhankelijk van het aantal paginas',
  },
  {
    commando: 'get-labelinnaam',
    naam: 'zichtbare tekst naast de toegankelijke naam',
    handeling: 'vergeleken',
    criteria: ['2.5.3'],
    toegestaneVlaggen: ['scope', 'klik'],
    vanafDeKaart: true,
    wat: 'Vergelijkt per bedieningselement de zichtbare tekst met de toegankelijke naam -- de kern van dit criterium.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-links',
    naam: 'de toegankelijke naam per link',
    handeling: 'uitgerekend',
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
    naam: 'een tabronde door de pagina',
    handeling: 'getabd',
    criteria: ['2.1.2'],
    toegestaneVlaggen: ['scope', 'klik', 'typ-in', 'typ', 'achteruit', 'max'],
    vanafDeKaart: true,
    wat: 'Drukt Tab, leest na elke druk uit welk element focus heeft, en herkent een val doordat de focus het gebied niet verlaat.',
    duurt: 'ongeveer 30 seconden',
  },
  {
    commando: 'get-videos',
    naam: 'de insluitcode van elke video',
    handeling: 'uitgelezen',
    criteria: ['2.1.4'],
    toegestaneVlaggen: ['scope', 'doorloop'],
    vanafDeKaart: true,
    wat: 'Zoekt de ingesloten videospelers en leest per speler de insluitcode.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-sneltoetsen',
    naam: 'losse toetsen ingedrukt',
    handeling: 'uitgeprobeerd',
    criteria: ['2.1.4'],
    toegestaneVlaggen: ['toetsen', 'in'],
    vanafDeKaart: false,
    wat: 'Drukt losse toetsen in en kijkt of er iets gebeurt.',
    waaromNiet: 'Dit is de uitzondering, alleen met een concrete aanleiding. Begin bij get-videos.',
  },
  {
    commando: 'get-flitsen',
    naam: 'helderheidssprongen geteld',
    handeling: 'geteld',
    criteria: ['2.3.1'],
    toegestaneVlaggen: ['seconden', 'klik'],
    vanafDeKaart: true,
    wat: 'Leest de beeldjes mee die de browser tekent en telt de helderheidssprongen, om te zien of er iets flitst.',
    duurt: 'ongeveer 20 seconden',
  },
  {
    commando: 'get-beweging',
    naam: 'drie opnamen na elkaar',
    handeling: 'gemeten',
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

/**
 * Wordt dit criterium over de hele steekproef beoordeeld?
 *
 * `sampleType` hoort erbij, want "de hele steekproef" is niet één set. De HTML-pagina's
 * vormen samen een website: daar gaat 3.2.4 over de vraag of de zoekknop op elke pagina
 * hetzelfde heet, en dat is één oordeel voor alle pagina's samen. Een PDF is geen pagina
 * van die website maar een document op zichzelf, met zijn eigen interne consistentie. Of
 * dezelfde koppeling in een rapport van 166 pagina's overal hetzelfde heet, staat los van
 * wat er op de site gebeurt -- en een tweede PDF staat daar weer los van.
 *
 * Zonder dat onderscheid verdween 3.2.4 voor elke PDF uit de werklijst, met het oordeel van
 * de homepage als stilzwijgend antwoord. Dat is geen verwijzing maar een andere vraag.
 * Vastgesteld door Frits op 2026-09-19 bij ZOET-01.
 */
export function isSitebreed(code: string, sampleType?: string | null): boolean {
  if (!SITEBREED_BEOORDEELD.includes(code)) return false;
  // Een PDF krijgt zijn eigen oordeel; alleen de HTML-samples delen er één.
  return sampleType !== 'pdf';
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
 *
 * Daarom krijgt deze lijst nooit `bron: 'steekproef'` maar `bron: 'workflow'`. Gooi je ze
 * op één hoop, dan zegt de kaart "door jou vastgesteld bij de steekproef" bij een oordeel
 * dat de onderzoeker nooit heeft gezien. Zo stond 1.4.2 op ZOET-01 tot 19 september 2026.
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

/**
 * De criteria die ALLEEN door een vinkje van de onderzoeker vervallen, met hun reden.
 *
 * Het verschil met `vervallenDoorVinkjes` is ALTIJD_NIET_AANWEZIG: dat zit daar wel in en
 * hier niet. Die lijst gaat over wat zo'n website naar zijn aard niet doet, en dat blijft
 * gelden ongeacht wat er op deze pagina staat -- een vinkje omzetten mag er dus niets aan
 * veranderen. Wat hieruit komt is precies wat er verandert als jij dit ene vinkje verzet.
 *
 * `vinkje` zegt welk vakje het criterium afsluit. Zet je dat vakje terug op "wel aanwezig"
 * of op "niet vastgesteld", dan moet het oordeel dat eruit voortkwam weer weg; zonder dat
 * veld zou de aanroeper moeten raden welke criteria bij welk vakje horen.
 */
export function vervaltDoorVinkje(sample: {
  heeftBewegendBeeld?: boolean | null;
  heeftFormulier?: boolean | null;
}): { code: string; reden: string; vinkje: Paginavinkje['veld'] }[] {
  const uit: { code: string; reden: string; vinkje: Paginavinkje['veld'] }[] = [];
  for (const vinkje of PAGINAVINKJES) {
    if (sample[vinkje.veld] !== false) continue;
    for (const code of vinkje.criteria) {
      uit.push({
        code,
        reden: `Op deze pagina staat geen ${vinkje.wat}. Vastgesteld door de onderzoeker bij het samenstellen van de steekproef; het criterium is daarmee niet van toepassing.`,
        vinkje: vinkje.veld,
      });
    }
  }
  return uit;
}

/**
 * Welke algemene meting een criterium DRAAGT, als het geen eigen meetcommando heeft.
 *
 * `get-html` en `get-screenshot` staan onder elk oordeel van een pagina: je haalt de pagina
 * één keer op, en daar rust alles op. Voor de meeste criteria is dat achtergrond. Maar acht
 * criteria hebben geen eigen commando en rusten er wél rechtstreeks op, en dan maakt het uit
 * hóé die meting is gedaan.
 *
 * Dit is geen dubbeling van `criteria` hierboven. Daar staat welke meting een criterium
 * bedient, en dat veld stuurt ook de meetknop op de kaart; `get-html` zou daar bij acht
 * criteria in de lijst komen te staan alsof hij bij de andere 25 niet hoort, terwijl hij
 * juist overal onder ligt. Hier staat alleen: als de badge moet wegen of er zorgvuldig is
 * gemeten, welke meting telt dan?
 *
 * De bron is telkens `### Zo is het vastgesteld` in het regelbestand:
 *
 *   1.1.1  "twee bronnen naast elkaar" — de code en de opname
 *   1.3.1  "die twee naast elkaar zijn precies de vergelijking die dit criterium vraagt"
 *   1.3.3  "de tekst van de pagina (...) en met de schermafdruk"
 *   1.4.1  de full-page opname, ook met `--zicht=grijs`
 *   1.4.5  "de opname van de hele pagina laat zien waar leesbare tekst in een afbeelding staat"
 *   2.4.6  alleen de code: koppen met niveau en tekst
 *   3.1.2  alleen de code: de taalmarkering per passage
 *   4.1.2  `get-links` staat al in `criteria`; de code geeft de knoppen en toestanden
 *
 * Verandert zo'n regelbestand, dan hoort deze lijst mee te veranderen. Staat een criterium
 * er niet in en heeft het ook geen eigen commando, dan weegt de badge alles wat eronder
 * ligt -- het oude gedrag.
 */
export const DRAGENDE_ALGEMENE_METING: Record<string, string[]> = {
  '1.1.1': ['get-html', 'get-screenshot'],
  '1.3.1': ['get-html', 'get-screenshot'],
  '1.3.3': ['get-html', 'get-screenshot'],
  '1.4.1': ['get-html', 'get-screenshot'],
  '1.4.5': ['get-html', 'get-screenshot'],
  '2.4.6': ['get-html'],
  '3.1.2': ['get-html'],
  '4.1.2': ['get-html'],
  /*
   * Deze drie hebben wél `get-pdfstructuur` in hun `criteria`, maar dat commando bestaat
   * alleen voor een PDF. Op een HTML-pagina hebben ze dus geen dragende meting, en dan
   * viel de badge terug op álles wat eronder lag.
   *
   *   2.4.2  "get-html geeft de titel terug zoals de browser hem na JavaScript toont"
   *   3.1.1  "get-html --full geeft het hele document na JavaScript, met het
   *          html-element en zijn lang-attribuut bovenaan"
   *   2.5.8  geen commando: "de agent leest in de auditsessie per element het klikbare
   *          gebied uit de opgemaakte pagina". De opname is daarvoor het bewijs, niet de
   *          code -- een klikgebied staat niet in de HTML.
   */
  '2.4.2': ['get-html'],
  '3.1.1': ['get-html'],
  '2.5.8': ['get-screenshot'],
  /*
   * De video- en formuliercriteria. Meestal vervallen ze via een paginavinkje, maar staat
   * er wél video of een formulier op de pagina, dan worden ze gewoon beoordeeld -- en dan
   * moet de kaart weten waarop.
   *
   *   1.2.1  "geen eigen meetcommando"; get-videos is op 2.1.4 geregistreerd
   *   1.2.2  idem; get-videosporen staat op 1.2.3 en 1.2.5
   *   1.2.4  "loopt via get-html en get-screenshot: zoek naar een ingesloten speler"
   *   1.3.5  "de agent leest de invoervelden uit de code (...) en legt die naast de
   *          WCAG-lijst en naast de schermafdruk"
   *   1.4.2  "get-html leest de media-elementen en kaders uit de code"
   *   3.3.1  "get-html geeft de velden en hun regels; get-screenshot --klik verstuurt"
   *   3.3.2  "get-html geeft per veld wat er in de code staat; de opname wat er zichtbaar
   *          bij staat. Het oordeel gaat over dat tweede."
   *   3.3.3  "dezelfde handelingen als bij 3.3.1"
   *   3.3.7  "get-html per stap in de auditsessie"
   */
  '1.2.1': ['get-html', 'get-screenshot'],
  '1.2.2': ['get-html', 'get-screenshot'],
  '1.2.4': ['get-html', 'get-screenshot'],
  '1.3.5': ['get-html', 'get-screenshot'],
  '1.4.2': ['get-html'],
  '3.3.1': ['get-html', 'get-screenshot'],
  '3.3.2': ['get-html', 'get-screenshot'],
  '3.3.3': ['get-html', 'get-screenshot'],
  '3.3.7': ['get-html'],
};

/**
 * Wat er met die algemene metingen is GEDAAN, in de woorden van het regelbestand.
 *
 * "de HTML en de schermafdruk" noemt twee bestanden; "code en beeld naast elkaar gelegd"
 * noemt de handeling. Dat laatste is wat de kaart hoort te zeggen, net als bij een
 * criterium met een eigen commando: daar staat "een tabronde door de pagina" en niet
 * "get-toetsenbordval".
 *
 * Elke zin komt uit `### Zo is het vastgesteld` van het criterium zelf. Bij 1.1.1 staat er
 * letterlijk "twee bronnen naast elkaar (...) het oordeel ontstaat pas als je die twee
 * tegen elkaar houdt". Frits, 2026-09-20.
 *
 * Staat een criterium hier niet in, dan valt de kaart terug op de namen van de metingen.
 */
export const HANDELING_PER_CRITERIUM: Record<string, string | { html: string; pdf: string }> = {
  '1.1.1': 'tekstalternatief naast het beeld gelegd',
  '1.2.1': 'in code en beeld gezocht naar video en audio',
  '1.2.2': 'in code en beeld gezocht naar video met geluid',
  '1.2.4': 'gezocht naar een speler met livesignalen',
  '1.3.1': 'structuur in de code naast het scherm gelegd',
  '1.3.3': 'de tekst nagelopen op verwijzingen naar vorm en plek',
  '1.3.5': 'autocomplete per veld naast de WCAG-lijst gelegd',
  '1.4.1': 'gekeken of kleur het enige verschil is',
  '1.4.2': 'gezocht naar geluid dat vanzelf begint',
  '1.4.5': 'gezocht naar tekst in afbeeldingen',
  '2.4.2': 'de titel naast de inhoud van de pagina gelegd',
  '2.4.6': 'elke kop tegen de tekst eronder gewogen',
  '2.5.8': 'het klikbare gebied per element uitgelezen',
  /*
   * Twee vormen, want het regelbestand kent ze: "get-html --full geeft het hele document
   * (...) met het lang-attribuut bovenaan. Bij een PDF leest de agent de documenttaal uit
   * de catalogus." Op een webpagina is "document" PDF-taal en leest het vreemd.
   */
  '3.1.1': { html: 'de taalinstelling van de pagina gelezen', pdf: 'de documenttaal uitgelezen' },
  '3.1.2': 'de taalmarkering per passage nagelopen',
  '3.3.1': 'het formulier verstuurd en de meldingen gelezen',
  '3.3.2': 'per veld gekeken wat er zichtbaar bij staat',
  '3.3.3': 'het formulier verstuurd en de meldingen gelezen',
  '3.3.7': 'de stappen doorlopen op al ingevulde gegevens',
  '4.1.2': 'naam, rol en toestand per element gelezen',
};

/** De handeling voor dit criterium, in de vorm die bij het sample past. */
export function handelingVoor(code: string, isPdf = false): string | undefined {
  const h = HANDELING_PER_CRITERIUM[code];
  if (!h) return undefined;
  return typeof h === 'string' ? h : isPdf ? h.pdf : h.html;
}

/**
 * De commando's waar dit criterium op rust: zijn eigen meting, of anders de algemene
 * meting uit de lijst hierboven. Leeg betekent: weeg alles wat eronder ligt.
 */
export function dragendeCommandos(code: string): string[] {
  const eigen = metingenVoorCriterium(code).map((m) => m.commando);
  const algemeen = DRAGENDE_ALGEMENE_METING[code] ?? [];
  // Geen Set-spread: dit bestand wordt ook gelezen met een oudere target.
  return eigen.concat(algemeen).filter((c, i, lijst) => lijst.indexOf(c) === i);
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
