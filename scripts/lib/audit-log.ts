import * as fs from 'fs';
import * as path from 'path';
import { OUTPUT_DIR, ensureOutputDir } from './browser-fetch';

/**
 * Het logboek van de audit-CLI: wat is er werkelijk gedraaid?
 *
 * Bestaat omdat een agent die zijn eigen bronnenlijst opschrijft, opnieuw een
 * bewering aflevert. Hij kan `get-reflow --breedte=320` in een onderbouwing zetten
 * zonder het ooit te hebben gedraaid, en aan de tekst is dat niet te zien. Dat is
 * dezelfde vorm als de problemen die deze auditor al eerder opleverde: een schone
 * uitkomst ziet er identiek uit aan niet-gekeken-hebben.
 *
 * Daarom schrijft de CLI het zelf weg, op het moment van uitvoeren. Wat er niet is
 * gedraaid, staat er niet in, en dat valt niet te omzeilen door het op te schrijven.
 *
 * Eén regel per aanroep, als JSON Lines — toevoegen kan zonder de rest te lezen, en
 * een half weggeschreven regel bederft de andere niet.
 */

const LOGBOEK = path.join(OUTPUT_DIR, 'logboek.jsonl');

/**
 * Welk succescriterium een commando dient.
 *
 * Deze koppeling hoort in de code en niet in wat een agent opgeeft: `get-reflow`
 * bestáát voor 1.4.10, `get-leesvolgorde` voor 1.3.2. Zo kan de toewijzing niet
 * verzonnen of verkeerd opgegeven worden.
 *
 * Commando's die hier niet in staan — `get-html`, `get-screenshot` — dienen elk
 * criterium en krijgen er dus geen. Dat is geen tekort maar een eerlijke weergave:
 * je haalt de pagina één keer op en gebruikt hem voor alles.
 */
const CRITERIA_PER_COMMANDO: Record<string, string[]> = {
  'get-leesvolgorde': ['1.3.2'],
  'get-contrast': ['1.4.3', '1.4.11'],
  'get-reflow': ['1.4.10'],
  'get-pixelcontrast': ['1.4.11'],
  'get-toetsenbordval': ['2.1.2'],
  'get-sneltoetsen': ['2.1.4'],
};

export interface LogRegel {
  /** Wanneer het commando draaide, in ISO-vorm. */
  tijd: string;
  commando: string;
  /** De vlaggen waarmee het draaide, zodat de meting te herhalen is. */
  argumenten: Record<string, string>;
  /** Het adres dat gevraagd werd. */
  url: string | null;
  /** Waar de browser uitkwam; wijkt dat af, dan is een andere pagina gemeten. */
  eindUrl?: string | null;
  /** De criteria die dit commando dient, uit de tabel hierboven. */
  criteria: string[];
  /** 'auditsessie' of 'headless'. Hoort bij de meting, zie Shift2_Bewijsvoering.md. */
  browser?: string | null;
  /**
   * In welke weergave er gemeten is: de standaardweergave of die na het aanzetten van
   * een schakelaar, meestal hoogcontrast.
   *
   * Zonder dit veld staan onder een oordeel dat op de hoogcontrastweergave rust
   * schermafdrukken in gewone kleuren, en is aan niets te zien dat die bij een andere
   * weergave horen. Heeft een site een hoogcontrastknop die zelf voldoet, dan is juist
   * die weergave de weergave die telt (Shift2_Regels_SC_1_4_3.md, stap 2), en dan is het
   * verschil tussen de twee het hele punt.
   */
  weergave?: string | null;
  /** Pad naar wat het opleverde. Kan verouderen: tmp/ staat in .gitignore. */
  artefact?: string | null;
  /**
   * Het beeld waarop de meting rust. Elk commando dat een pagina opent vult dit.
   *
   * Een tekstbestand is geen bewijs dat iemand kan nakijken. `get-html --text` liet een
   * .txt achter en `get-contrast` helemaal niets, dus op de kaart stond een oordeel met
   * een bestandsnaam eronder en geen manier om te zien of het klopte. De browser staat op
   * dat moment toch al open, dus een opname kost bijna niets en maakt het verschil tussen
   * een bewering en bewijs.
   *
   * Staat los van `artefact`: bij get-html is dat de opgehaalde tekst en dit het beeld
   * ernaast. Bij get-reflow zijn ze hetzelfde bestand.
   */
  schermafdruk?: string | null;
  /**
   * Extra beelden bij deze meting, met een bijschrift erbij.
   *
   * Eén opname is genoeg voor een meting van één ding, maar niet voor een meting die een
   * hele pagina afloopt of die een element in twee toestanden bekijkt. "Zes elementen
   * veranderen als de muis erop staat" is zonder beeld precies zo'n bewering als de
   * kwalificaties die we eruit aan het halen zijn.
   */
  schermafdrukken?: { pad: string; bijschrift: string }[];
  /** Korte samenvatting van de uitkomst, zodat een hermeting te vergelijken is. */
  uitkomst?: Record<string, unknown>;
}

/**
 * Voegt een regel toe aan het logboek.
 *
 * Faalt nooit hard: een audit mag niet stuklopen omdat het bijhouden misgaat. Een
 * fout gaat naar stderr, zodat stdout pure JSON blijft voor wie het antwoord parseert.
 */
export function legVast(regel: Omit<LogRegel, 'tijd' | 'criteria'> & { criteria?: string[] }): void {
  try {
    ensureOutputDir();
    const volledig: LogRegel = {
      tijd: new Date().toISOString(),
      criteria: regel.criteria ?? CRITERIA_PER_COMMANDO[regel.commando] ?? [],
      ...regel,
    };
    fs.appendFileSync(LOGBOEK, JSON.stringify(volledig) + '\n', 'utf8');
  } catch (err) {
    console.error(`[audit-cli] waarschuwing: kon niet naar het logboek schrijven — ${String(err)}`);
  }
}

/**
 * Leest het logboek. Regels die niet te ontleden zijn worden overgeslagen: een
 * afgebroken schrijfactie mag de rest niet onbruikbaar maken.
 */
export function leesLogboek(): LogRegel[] {
  if (!fs.existsSync(LOGBOEK)) return [];
  return fs
    .readFileSync(LOGBOEK, 'utf8')
    .split('\n')
    .filter((r) => r.trim())
    .map((r) => {
      try {
        return JSON.parse(r) as LogRegel;
      } catch {
        return null;
      }
    })
    .filter((r): r is LogRegel => r !== null);
}

export { LOGBOEK, CRITERIA_PER_COMMANDO };
