/**
 * Wat er per deelgebied is nagelopen, bij één sampleoordeel.
 *
 * Sommige criteria bestaan uit meerdere losse vragen. SC 1.3.1 is er zo een: dertien
 * gebieden, van koppen tot citaten. Daar is één oordeel voor, met een onderbouwing in
 * lopende tekst — en die tekst maakt geen verschil tussen "geen tabellen op deze pagina" en
 * "niet naar tabellen gekeken". Een verhaal dat iets weglaat leest hetzelfde als een verhaal
 * dat niets te melden had.
 *
 * Dit bestand houdt de regels op één plek, want twee routes gebruiken ze: de route die de
 * gebieden los bijwerkt, en de route die een oordeel wegschrijft en de gebieden meteen
 * meeneemt. Liepen die uiteen, dan zou dezelfde invoer op de ene weg geweigerd worden en op
 * de andere niet.
 */

import { leesKaarttekst } from '@/lib/criterium-kaarttekst';

/**
 * `opmerking` staat er sinds 2026-08-23, en niet uit volledigheidsdrang.
 *
 * De eerste versie kende alleen ok, nvt en fout. Op de homepage van heuvelrug.nl staat het
 * bezoekadres in dezelfde opsomming als de drie contactnummers (B003) — volgens de regels een
 * OPMERKING en uitdrukkelijk geen afkeuring, want er gaat niets verloren; er wordt alleen een
 * verband beweerd dat er niet is. Zonder deze waarde moest dat als `fout` weg, en dan staat er
 * een rood kruis bij iets dat het criterium niet laat zakken.
 */
export const UITKOMSTEN = ['ok', 'nvt', 'fout', 'opmerking'] as const;
export type Uitkomst = (typeof UITKOMSTEN)[number];

export interface GebiedUitkomst {
  gebied: string;
  uitkomst: Uitkomst;
  toelichting?: string;
  /**
   * De bevindingen die bij dit gebied horen, als **id** van de finding.
   *
   * Een bevinding hangt in de database aan een criterium en een sample, niet aan een gebied.
   * Dat is genoeg om hem in het rapport te krijgen, maar niet om op de kaart te laten zien
   * wélke afkeuring bij welk gebied hoort — en juist dat is wat je bij het nakijken wilt
   * weten. Op 2026-08-31 stonden er op de 1.1.1-kaart van Home twee gebieden op `fout` met
   * één bevinding eronder, en het kostte een omweg om vast te stellen dat er niets ontbrak.
   *
   * HET ID EN NIET DE FINDINGCODE. Die code verandert: een voorstel heet `V001`, en zodra de
   * onderzoeker akkoord geeft wordt het `B00x` uit een andere reeks — niet eens hetzelfde
   * nummer (zie lib/finding-code.ts). Een koppeling op de code zou dus stukgaan op precies
   * het moment dat het oordeel definitief wordt, en dat merk je pas de volgende keer dat je
   * de kaart opent. Het id verandert nooit.
   *
   * Staat hier niets, dan is er geen koppeling vastgelegd: bij oordelen van vóór 31 augustus
   * 2026 is dat de normale situatie, en dan toont de kaart de bevindingen los eronder.
   *
   * Eén bevinding mag bij twee gebieden horen. De kaart toont hem dan bij het eerste en
   * noemt hem bij het tweede, zodat dezelfde tekst er niet twee keer staat.
   */
  bevindingen?: string[];
  /**
   * Waar op de pagina het probleem zit, als CSS-selector per bevinding-id.
   *
   * `{ "<uuid>": "header .logo img" }`. De kaart zet er een kader omheen als je bij die
   * bevinding op "Laat het me zien in de browser" klikt.
   *
   * Waarom niet één selector per gebied: een gebied kan meerdere bevindingen hebben, en die
   * wijzen elk iets anders aan. En waarom hier en niet op de bevinding zelf: dat zou een
   * migratie kosten, en deze kolom is toch al de plek waar de koppeling staat.
   *
   * Een selector kan verouderen als de site verandert. Dat is geen fout in het oordeel — de
   * route meldt dan gewoon dat het element er niet meer is.
   */
  aanwijzingen?: Record<string, string>;
}

/** De bestaande lijst, met de rommel eruit. Wat er niet uitziet als een regel, telt niet. */
export function huidigeLijst(waarde: unknown): GebiedUitkomst[] {
  if (!Array.isArray(waarde)) return [];
  return waarde.filter(
    (r): r is GebiedUitkomst =>
      !!r &&
      typeof r === 'object' &&
      typeof (r as any).gebied === 'string' &&
      UITKOMSTEN.includes((r as any).uitkomst)
  );
}

/** De deelgebieden die dit criterium kent, uit zijn regelbestand. Leeg = het heeft er geen. */
export function bekendeGebieden(criterionCode: string): string[] {
  return leesKaarttekst(criterionCode)?.gebieden ?? [];
}

/**
 * Leest en controleert wat er aan gebieden is meegestuurd.
 *
 * De gebieden staan in het regelbestand, niet in de database, en dus is dít de plek waar
 * gecontroleerd wordt of een naam bestaat. Zonder die controle zou een tikfout stilzwijgend
 * niets doen: de regel komt in de kolom te staan, de kaart zoekt hem op naam op, vindt niets,
 * en toont het gebied als "nog niet nagelopen". Het werk is dan gedaan en toch onzichtbaar —
 * precies het gat dat deze hele lijst moet dichten.
 */
export function leesGebieden(
  criterionCode: string,
  ingevoerd: unknown[],
  bekend: string[]
): { fout: string; bekendeGebieden?: string[] } | { gebieden: GebiedUitkomst[] } {
  const nieuw: GebiedUitkomst[] = [];
  for (const r of ingevoerd) {
    const gebied = String((r as any)?.gebied ?? '').trim();
    const uitkomst = String((r as any)?.uitkomst ?? '').trim();
    const toelichting = String((r as any)?.toelichting ?? '').trim();

    if (!bekend.includes(gebied)) {
      return { fout: `onbekend gebied "${gebied}" bij ${criterionCode}`, bekendeGebieden: bekend };
    }
    if (!UITKOMSTEN.includes(uitkomst as Uitkomst)) {
      return { fout: `uitkomst moet ${UITKOMSTEN.join(', ')} zijn, niet "${uitkomst}"` };
    }
    // Een fout of opmerking zonder uitleg is een teken waar niemand iets mee kan. Bij `ok`
    // en `nvt` mag de uitleg weg: daar is de uitkomst zelf het hele bericht.
    if ((uitkomst === 'fout' || uitkomst === 'opmerking') && !toelichting) {
      return { fout: `gebied "${gebied}" staat op ${uitkomst}; schrijf erbij wat er aan de hand is` };
    }

    // De id's van de bevindingen die bij dit gebied horen. Wat er niet uitziet als een id
    // wordt weggelaten in plaats van het hele gebied te weigeren: een kapotte koppeling mag
    // niet betekenen dat een compleet nagelopen gebied niet opgeslagen kan worden.
    const koppelingen = Array.isArray((r as any)?.bevindingen)
      ? (r as any).bevindingen
          .map((c: unknown) => String(c ?? '').trim())
          .filter((c: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c),
          )
      : [];

    // De selectors per bevinding-id. Alleen wat bij een gekoppelde bevinding hoort en wat
    // eruitziet als een selector; de rest valt weg in plaats van het gebied te weigeren.
    const aanwijzingen: Record<string, string> = {};
    const ruw = (r as any)?.aanwijzingen;
    if (ruw && typeof ruw === 'object' && !Array.isArray(ruw)) {
      for (const [id, sel] of Object.entries(ruw)) {
        const s = String(sel ?? '').trim();
        if (!s || s.length > 300) continue;
        if (!koppelingen.includes(id)) continue;
        aanwijzingen[id] = s;
      }
    }

    nieuw.push({
      gebied,
      uitkomst: uitkomst as Uitkomst,
      ...(toelichting ? { toelichting } : {}),
      ...(koppelingen.length ? { bevindingen: koppelingen } : {}),
      ...(Object.keys(aanwijzingen).length ? { aanwijzingen } : {}),
    });
  }
  return { gebieden: nieuw };
}

/**
 * Samenvoegen, niet overschrijven.
 *
 * Een ronde hoeft niet alle dertien gebieden tegelijk te doen — je kunt de koppen nu
 * nalopen en de tabellen straks. Wie de hele lijst opnieuw wil zetten, stuurt hem gewoon in
 * zijn geheel op. De uitkomst staat in de volgorde van het regelbestand, zodat de kaart niet
 * van volgorde verspringt afhankelijk van wie wanneer wat invulde.
 */
export function voegSamen(
  bestaand: GebiedUitkomst[],
  nieuw: GebiedUitkomst[],
  bekend: string[]
): { gebieden: GebiedUitkomst[]; open: string[] } {
  const perGebied = new Map(bestaand.map((g) => [g.gebied, g]));
  for (const g of nieuw) perGebied.set(g.gebied, g);
  return {
    gebieden: bekend.map((g) => perGebied.get(g)).filter(Boolean) as GebiedUitkomst[],
    open: bekend.filter((g) => !perGebied.has(g)),
  };
}
