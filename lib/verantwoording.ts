/**
 * Het meetspoor onder een oordeel: wat er gedraaid is, en in welke vorm dat op de kaart
 * belandt.
 *
 * Twee wegen leiden hierheen, en ze moeten hetzelfde opleveren:
 *
 *   `koppel-logboek`         — het hele logboek in één keer over een project verdelen
 *   de knop op de kaart      — één meting, voor één pagina, voor één criterium
 *
 * Zou elk van die twee zelf bepalen welke velden meegaan, dan ziet dezelfde meting er op
 * de kaart anders uit al naar gelang wie hem startte — en dan is niet meer te zeggen wat
 * "geen schermafdruk" betekent. Daarom staat de vertaling van logboekregel naar
 * kaartmeting hier, één keer.
 *
 * Type-only import van de logregel: dit bestand wordt ook door de browser geladen en mag
 * `fs` niet meeslepen.
 */

import type { LogRegel } from '../scripts/lib/audit-log';

/** Eén meting, zoals hij onder een oordeel wordt bewaard en op de kaart verschijnt. */
export interface Meting {
  commando: string;
  argumenten?: Record<string, string>;
  url?: string | null;
  tijd?: string;
  /**
   * De handeling in woorden: wat er gekeken is en wat eruit kwam. Geschreven door de code
   * die de meting deed, niet door een agent. Metingen van vóór dit veld hebben hem niet;
   * de kaart valt dan terug op de aanroep.
   */
  stap?: string | null;
  browser?: string | null;
  artefact?: string | null;
  /** Het beeld waarop de meting rust. Bij get-html iets anders dan het artefact. */
  schermafdruk?: string | null;
  /** Extra beelden met bijschrift, bijvoorbeeld een element in rust en met de muis erop. */
  schermafdrukken?: { pad: string; bijschrift: string }[] | null;
  /** In welke weergave gemeten is: standaard, of na het aanzetten van hoogcontrast. */
  weergave?: string | null;
  uitkomst?: Record<string, unknown>;
  /** Hoe vaak deze meting is gedraaid. Alleen de laatste staat er; dit is het aantal. */
  keer?: number;
}

/**
 * Commando's die elk criterium dienen. Die horen bovenaan de kaart: je haalt de pagina
 * één keer op, en daar rust alles op wat eronder staat.
 */
const ALGEMEEN = new Set(['get-html', 'get-screenshot']);

/** Vertaalt een logboekregel naar de meting zoals de kaart hem bewaart. */
export function metingUitLogregel(r: LogRegel): Meting {
  return {
    commando: r.commando,
    argumenten: r.argumenten,
    url: r.url,
    tijd: r.tijd,
    // De handeling in woorden. Oudere regels hebben dit niet; dan valt de kaart terug
    // op de aanroep, zoals hij het altijd deed.
    stap: r.stap ?? null,
    browser: r.browser,
    weergave: r.weergave ?? null,
    artefact: r.artefact,
    // Oudere regels hebben dit veld niet. Staat er alleen een artefact en is dat een
    // afbeelding, dan is dát het beeld — anders had de kaart voor alles wat vóór
    // vandaag gemeten is geen schermafdruk meer.
    schermafdruk:
      r.schermafdruk ?? (r.artefact && /\.(png|jpe?g)$/i.test(r.artefact) ? r.artefact : null),
    schermafdrukken: r.schermafdrukken ?? [],
    uitkomst: r.uitkomst,
  };
}

/**
 * Waaraan je ziet of twee metingen dezelfde meting zijn.
 *
 * Op commando plus wát er gemeten is. Wie een meting herhaalt levert geen nieuw bewijs;
 * alleen de laatste telt. Zonder dit vulde de kaart zich met zes identieke
 * reflow-regels — testklikken op "Nog eens meten" — en was niet meer te zien wat er
 * werkelijk was gedaan.
 *
 * `klik` telt bewust NIET mee. Meet je hetzelfde element eerst in de standaardweergave en
 * daarna in de hoogcontrastweergave, dan is dat tweede een correctie op het eerste en geen
 * tweede bewijsstuk. Bleef de eerste staan, dan stonden er onder een hoogcontrastoordeel
 * opnamen in gewone kleuren die nergens meer op sloegen.
 *
 * `breedte` telt wél mee: een reflow-meting op 320 en op 1280 zijn twee metingen, niet
 * dezelfde meting overgedaan.
 */
export function vormVanMeting(commando: string, argumenten: Record<string, string> = {}): string {
  const { klik: _klik, ...watGemeten } = argumenten;
  // Een vlag die de standaardwaarde meegeeft is dezelfde meting als die vlag weglaten.
  // `--scope=pagina` was ooit nodig en is nu de standaard; zonder deze regel staan de
  // oude en de nieuwe aanroep als twee metingen op de kaart terwijl ze hetzelfde doen.
  if (watGemeten.scope === 'pagina') delete watGemeten.scope;
  // `max` is een dekkingsgrens en geen meetinstelling: hetzelfde onderzoek met max=4 is een
  // mindere versie van datzelfde onderzoek met max=20, niet een tweede bewijsstuk. Telde hij
  // mee, dan stonden er drie get-consistentie-regels op één kaart met de oudste bovenaan.
  // Hoeveel er werkelijk bekeken is, staat in de uitkomst van de meting zelf.
  delete watGemeten.max;
  return `${commando}|${JSON.stringify(watGemeten)}`;
}

/**
 * Zet de metingen in de volgorde waarin je ze wilt lezen: van overzicht naar detail.
 *
 * Een meting die de hele pagina afloopt zegt wát er onder dit criterium valt; de metingen
 * van losse elementen zijn de uitwerking daarvan. Op tijd gesorteerd belandde
 * `get-nietteksten` onderaan omdat hij toevallig het laatst gedraaid was, en las de kaart
 * van detail naar overzicht. Sorteren in JavaScript is stabiel, dus binnen een rang
 * blijft de onderlinge volgorde staan.
 */
export function opLeesvolgorde(metingen: Meting[]): Meting[] {
  const rang = (m: Meting) =>
    ALGEMEEN.has(m.commando) ? 0 : m.argumenten?.selector ? 2 : 1;
  return [...metingen].sort((a, b) => rang(a) - rang(b));
}

/**
 * Voegt één meting toe aan wat er al onder een oordeel stond.
 *
 * Stond dezelfde meting er al, dan vervangt de nieuwe hem en gaat de teller een omhoog:
 * de vorige uitkomst is dan achterhaald, niet een tweede bewijsstuk. De rest blijft
 * ongemoeid — deze functie hangt bewijs aan een oordeel en raakt het oordeel zelf niet aan.
 */
export function voegMetingToe(bestaand: Meting[] | null | undefined, nieuw: Meting): Meting[] {
  const lijst = Array.isArray(bestaand) ? bestaand : [];
  const vorm = vormVanMeting(nieuw.commando, nieuw.argumenten ?? {});
  const plek = lijst.findIndex(
    (m) => vormVanMeting(m.commando, m.argumenten ?? {}) === vorm
  );
  const metTeller: Meting = {
    ...nieuw,
    keer: plek >= 0 ? (lijst[plek].keer ?? 1) + 1 : 1,
  };
  const uit = [...lijst];
  if (plek >= 0) uit[plek] = metTeller;
  else uit.push(metTeller);
  return opLeesvolgorde(uit);
}
