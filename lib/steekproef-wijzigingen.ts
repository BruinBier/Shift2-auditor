/**
 * Welke pagina's van de steekproef bij een herinspectie anders zijn dan bij de nulmeting.
 *
 * Een pagina die bij de herinspectie niet meer bestaat, gaat uit de steekproef en wordt
 * vervangen door een vergelijkbare. Zonder toelichting ziet de lijst in het rapport er
 * dan anders uit dan die van de nulmeting, en kan de controlerende instantie (Logius)
 * niet zien waarom. Daarom krijgt een pagina die er bij de nulmeting wel was en nu niet
 * "Vervallen / Offline", en een pagina die er nu bij is gekomen "Toegevoegd
 * (Herinspectie)". Frits, 2026-10-20, bij BEV-01: Groene verhalen gaf een 404 en is
 * vervangen door Wat te doen bij een noodsituatie.
 *
 * Er wordt niets opgeslagen: de status volgt uit de vergelijking met de steekproef van
 * het bovenliggende project. Een vervallen pagina hoeft dus niet in de herinspectie te
 * blijven staan; verwijderen uit de steekproef is genoeg. Een aanvullend onderzoek heeft
 * geen bovenliggend project en krijgt geen labels.
 */

export const STATUS_VERVALLEN = 'Vervallen / Offline';
export const STATUS_TOEGEVOEGD = 'Toegevoegd (Herinspectie)';

export type SteekproefStatus = typeof STATUS_VERVALLEN | typeof STATUS_TOEGEVOEGD | null;

type Pagina = { url?: string | null; title?: string | null };

export type SteekproefRegel<T extends Pagina> = { item: T; status: SteekproefStatus };

/** Dezelfde pagina met een slash of hoofdletter in de host verschil telt niet als nieuw. */
function sleutel(p: Pagina): string | null {
  const url = p.url?.trim();
  if (url) {
    try {
      const u = new URL(url);
      u.hash = '';
      const pad = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : u.pathname;
      return `url:${u.protocol}//${u.host.toLowerCase()}${pad}${u.search}`;
    } catch {
      return `url:${url}`;
    }
  }
  const titel = p.title?.trim();
  return titel ? `titel:${titel}` : null;
}

/**
 * Hoeveel pagina's er bij een herinspectie zijn bijgekomen en weggevallen. De samenvatting
 * zei "dezelfde 21 pagina's opnieuw beoordeeld", ook als er twee waren vervangen (BEV-01,
 * 2026-10-20); zie `samenvattingHtml` in lib/samenvatting.ts.
 */
export function telWijzigingen(regels: { status: SteekproefStatus }[]): {
  nieuw: number;
  vervallen: number;
} {
  return {
    nieuw: regels.filter((r) => r.status === STATUS_TOEGEVOEGD).length,
    vervallen: regels.filter((r) => r.status === STATUS_VERVALLEN).length,
  };
}

/**
 * De steekproef zoals het rapport hem toont: de huidige pagina's in hun eigen volgorde,
 * met de vervallen pagina's van de nulmeting erachter.
 *
 * `nulmeting` is null als er niets te vergelijken valt (een nulmeting zelf, of een
 * aanvullend onderzoek): dan komt de lijst ongewijzigd en zonder labels terug.
 */
export function steekproefMetWijzigingen<T extends Pagina>(
  huidig: T[],
  nulmeting: T[] | null
): SteekproefRegel<T>[] {
  if (!nulmeting) return huidig.map((item) => ({ item, status: null }));

  const inNulmeting = new Set(nulmeting.map(sleutel).filter((s): s is string => s !== null));
  const inHuidig = new Set(huidig.map(sleutel).filter((s): s is string => s !== null));

  const regels: SteekproefRegel<T>[] = huidig.map((item) => {
    const s = sleutel(item);
    return { item, status: s !== null && !inNulmeting.has(s) ? STATUS_TOEGEVOEGD : null };
  });
  for (const item of nulmeting) {
    const s = sleutel(item);
    if (s !== null && !inHuidig.has(s)) regels.push({ item, status: STATUS_VERVALLEN });
  }
  return regels;
}
