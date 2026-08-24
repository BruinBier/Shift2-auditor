/**
 * De tekst die boven de meting op een kaart in "Waar sta ik" staat.
 *
 * Die tekst staat op één plek: in het regelbestand van het criterium zelf, onder het kopje
 * `## Op de kaart`. De kaart leest dat bestand rechtstreeks — er is geen gegenereerd
 * tussenbestand en geen commando dat iemand moet draaien.
 *
 * Dat is een bewuste keuze. De onderbouwing op de 3.2.4-kaart was verouderd zonder dat
 * iemand een fout had gemaakt: `get-consistentie` ging iconen vergelijken en de tekst groeide
 * niet mee, want bijwerken was een stap die je kon overslaan zonder dat er iets stukging. Een
 * gegenereerd bestand bouwt precies die stap opnieuw. Dit niet.
 *
 * Ontbreekt het kopje, dan levert dit `null` en toont de kaart wat hij altijd toonde. Zo
 * verandert er niets aan de criteria die nog geen tekst hebben.
 *
 * Alleen aan te roepen op de server: dit leest van schijf.
 */

import fs from 'fs';
import path from 'path';

/**
 * Eén handeling uit de audit-instructies, met wie hem uitvoert.
 *
 * Dat onderscheid is nodig omdat het meeste al gedaan is. "Loop de site door en zoek
 * onderdelen" is geen opdracht aan de onderzoeker maar een beschrijving van wat
 * `get-consistentie` deed; als dat als instructie op de kaart staat, gaat iemand zestien
 * pagina's doorlopen die al vergeleken zijn.
 */
export interface Stap {
  tekst: string;
  /**
   * Wie de stap uitvoert.
   *
   * `meting` — een commando doet het, en de uitkomst staat op de kaart.
   * `agent`  — geen commando, maar wel na te lopen met een browser: klikken, kijken waar
   *            je uitkomt. Feitenwerk, geen oordeel.
   * `jij`    — er is een mens voor nodig, want er wordt gewogen.
   */
  door: 'meting' | 'agent' | 'jij';
}

export interface Kaarttekst {
  /** De naam van de toets in gewone taal, zonder criteriumnummer. */
  titel: string;
  /** Waar het in één zin op neerkomt, per alinea. */
  inKort: string[];
  /**
   * De audit-instructies, gegroepeerd. Een groep is een fase met een eigen kop —
   * "Stap 1 — In de auditsessie", "Stap 2 — In de code" — met de handelingen eronder.
   * Staat er geen `####`-kop in het bestand, dan is er één groep zonder titel.
   */
  instructies: { titel: string; stappen: Stap[] }[];
  /**
   * Hoe het is vastgesteld: wat het gereedschap doet en waar de gegevens vandaan komen.
   *
   * Onder "Zo is het vastgesteld" stonden alleen de commando’s met hun tijdstip. Dat zegt
   * wat er gedraaid is, niet wat er gebeurd is — en al helemaal niet waar de gegevens
   * vandaan komen of wat het gereedschap niet ziet.
   */
  vastgesteld: string[];
  /**
   * De deelgebieden die bij dit criterium hoe dan ook langsgelopen worden.
   *
   * Alleen gevuld bij een criterium dat uit meerdere losse vragen bestaat. 1.3.1 is er zo
   * een: dertien gebieden, van koppen tot citaten. Bij BEV-03 (2026-08-04) stond 1.3.1 op
   * `opmerking` met een onderbouwing die alleen over koppen ging, terwijl er `em`-elementen
   * om gewone zinnen stonden. Dat gat is met lopende tekst niet te zien — met een lijstje
   * waarop één gebied leeg blijft wel.
   *
   * Leeg betekent: dit criterium is één vraag, en dan is een lijstje ruis.
   */
  gebieden: string[];
}

const KOP_BLOK = 'Op de kaart';
const KOP_TITEL = 'Titel';
const KOP_KORT = 'In het kort';
const KOP_INSTRUCTIES = 'Audit-instructies';
const KOP_VASTGESTELD = 'Zo is het vastgesteld';
const KOP_GEBIEDEN = 'Deelgebieden';

/**
 * Onthouden, maar opnieuw lezen zodra het bestand is gewijzigd.
 *
 * Eerst onthield dit per proces, en dat brak de belofte van dit bestand: wie de tekst
 * aanpaste zag hem pas terug na een herstart van de server. Dat is precies de tussenstap
 * die hier niet hoort te zijn — dan kun je net zo goed een kopie genereren.
 *
 * De wijzigingstijd opvragen kost een fractie van het lezen zelf, dus de winst blijft.
 */
const onthouden = new Map<string, { tijd: number; waarde: Kaarttekst | null }>();

function bestandVoor(code: string): string {
  return path.join(process.cwd(), 'wcag-regels', `Shift2_Regels_SC_${code.replace(/\./g, '_')}.md`);
}

/** De regels onder een kopje, tot het volgende kopje van hetzelfde of hoger niveau. */
function sectie(regels: string[], kop: string, niveau: number): string[] {
  const merk = '#'.repeat(niveau) + ' ' + kop;
  const begin = regels.findIndex((r) => r.trim() === merk);
  if (begin < 0) return [];
  const rest = regels.slice(begin + 1);
  const eind = rest.findIndex(
    (r) => /^#{1,6}\s/.test(r) && (r.match(/^#+/)?.[0].length ?? 9) <= niveau
  );
  return eind < 0 ? rest : rest.slice(0, eind);
}

/**
 * Blokcitaten vallen weg: die staan er als aanwijzing voor wie het bestand bewerkt
 * ("houd het kort"), niet als tekst voor de onderzoeker.
 *
 * De regelafbrekingen van het markdown-bestand gaan er ook uit. Daar staat een zin over drie
 * regels omdat het bestand op tachtig tekens wordt afgebroken; op een kaart hoort die zin mee
 * te lopen met de breedte van het scherm. Een lege regel blijft wél een alineagrens.
 */
function alsAlineas(regels: string[]): string[] {
  const zonderCitaat = regels.filter((r) => !r.trimStart().startsWith('>'));
  const blokken = zonderCitaat.join('\n').trim().split(/\n\s*\n/);
  return blokken
    .map((blok) =>
      blok
        .split('\n')
        .map((r) => r.trim())
        .join(' ')
        .trim()
    )
    .filter(Boolean);
}

/**
 * Een genummerde lijst uit markdown, als losse stappen.
 *
 * Een stap mag over meerdere regels lopen — het bestand breekt op tachtig tekens af — dus
 * een regel die niet met een nummer begint hoort bij de vorige stap.
 */
function alsLijst(regels: string[]): { titel: string; stappen: Stap[] }[] {
  const groepen: { titel: string; stappen: Stap[] }[] = [{ titel: '', stappen: [] }];
  for (const regel of regels) {
    const kaal = regel.trim();
    if (!kaal) continue;
    if (kaal.startsWith('>')) continue;
    // Een `####`-kop begint een nieuwe fase.
    const kop = kaal.match(/^#{4,6}\s+(.*)$/);
    if (kop) {
      groepen.push({ titel: kop[1].trim(), stappen: [] });
      continue;
    }
    const huidig = groepen[groepen.length - 1];
    const begin = kaal.match(/^(\d+)[.)]\s+(.*)$/);
    if (begin) {
      // De markering aan het begin zegt wie de stap uitvoert. Staat er niets, dan is
      // het aan de onderzoeker: dat is de veilige aanname, want een stap ten onrechte
      // afvinken is erger dan er een te veel voorleggen.
      let tekst = begin[2].trim();
      let door: 'meting' | 'agent' | 'jij' = 'jij';
      if (tekst.startsWith('[meting]')) {
        door = 'meting';
        tekst = tekst.slice(8).trim();
      } else if (tekst.startsWith('[agent]')) {
        door = 'agent';
        tekst = tekst.slice(7).trim();
      } else if (tekst.startsWith('[jij]')) {
        tekst = tekst.slice(5).trim();
      }
      huidig.stappen.push({ tekst, door });
    }
    else if (huidig.stappen.length)
      huidig.stappen[huidig.stappen.length - 1].tekst += ' ' + kaal;
  }
  return groepen.filter((g) => g.stappen.length);
}

/** De kaarttekst van één criterium, of `null` als het regelbestand er geen heeft. */
export function leesKaarttekst(code: string): Kaarttekst | null {
  const bestand = bestandVoor(code);
  let tijd = 0;
  try {
    tijd = fs.statSync(bestand).mtimeMs;
  } catch {
    // Geen bestand; dan is 0 een prima stempel.
  }
  const bekend = onthouden.get(code);
  if (bekend && bekend.tijd === tijd) return bekend.waarde;

  let uit: Kaarttekst | null = null;
  try {
    const regels = fs.readFileSync(bestand, 'utf8').split(/\r?\n/);
    const blok = sectie(regels, KOP_BLOK, 2);
    const titel = alsAlineas(sectie(blok, KOP_TITEL, 3))[0] ?? "";
    const inKort = alsAlineas(sectie(blok, KOP_KORT, 3));
    const instructies = alsLijst(sectie(blok, KOP_INSTRUCTIES, 3));
    // Mag ontbreken: dan toont de kaart alleen de metingen, zoals voorheen.
    const vastgesteld = alsAlineas(sectie(blok, KOP_VASTGESTELD, 3));
    // Dezelfde vorm als de instructies — een genummerde lijst — maar zonder `[meting]`-
    // markering: een gebied wordt niet uitgevoerd, het wordt afgevinkt.
    const gebieden = alsLijst(sectie(blok, KOP_GEBIEDEN, 3)).flatMap((g) =>
      g.stappen.map((s) => s.tekst)
    );
    // Alle drie of niets. Eén ontbrekend blok toont een kaart met een gat erin, en dan
    // is terugvallen op de oude kaart eerlijker dan half beginnen.
    if (titel && inKort.length && instructies.length)
      uit = { titel, inKort, instructies, vastgesteld, gebieden };
  } catch {
    // Geen regelbestand voor dit criterium. Dat is geen fout: de meeste hebben er geen.
  }

  onthouden.set(code, { tijd, waarde: uit });
  return uit;
}

/** De kaartteksten van een reeks criteria, alleen die er een hebben. */
export function leesKaartteksten(codes: string[]): Record<string, Kaarttekst> {
  const uit: Record<string, Kaarttekst> = {};
  for (const code of codes) {
    const t = leesKaarttekst(code);
    if (t) uit[code] = t;
  }
  return uit;
}
