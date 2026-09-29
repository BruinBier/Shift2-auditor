import type { Vingerafdruk } from './vingerafdruk';

/**
 * Sjabloonclusters (steekproefselectie v2, fase 3). SCHADUWFUNCTIE: geen invloed op
 * profielkeuze, budget of steekproef.
 *
 * Gelijkenis tussen twee pagina's (0..1):
 *   - verschillend inhoudstype volgens het CMS (page tegenover news)  -> 0;
 *   - de ene met CMS-data, de andere zonder (een /form/-pagina)        -> 0;
 *   - anders een gewogen Jaccard over de drie delen van de vingerafdruk:
 *       met CMS-data:    0,40 cms + 0,45 dom + 0,15 kop
 *       zonder CMS-data: 0,80 dom + 0,20 kop
 *
 * Clusteren met COMPLETE LINKAGE: twee groepen gaan pas samen als ELK paar pagina's
 * minstens de drempel haalt. Dat is strenger dan single linkage (één brug is genoeg), en
 * dat is de bedoeling: een onterechte samenvoeging is riskanter dan een onterechte
 * splitsing (besluit fase 3). Een keten A~B~C met A en C ongelijk wordt dus niet één cluster.
 *
 * Deterministisch: pagina's op urlNorm gesorteerd, bij gelijke gelijkenis wint het paar met
 * de laagste index. De samenvoegingen worden één keer uitgerekend (een dendrogram); elke
 * drempel is daarna een snede, zodat 0,70 tot 0,90 exact dezelfde boom delen.
 */

export const CLUSTER_VERSIE = 1;

export interface ClusterInvoer {
  urlNorm: string;
  titel: string | null;
  vingerafdruk: Vingerafdruk;
}

const jaccard = (A: Set<string>, B: Set<string>): number => {
  if (!A.size && !B.size) return 1;
  let doorsnede = 0;
  for (const x of B) if (A.has(x)) doorsnede++;
  const vereniging = A.size + B.size - doorsnede;
  return vereniging ? doorsnede / vereniging : 1;
};

interface Sets {
  type: string | null;
  metCms: boolean;
  cms: Set<string>;
  dom: Set<string>;
  kop: Set<string>;
}
const alsSets = (v: Vingerafdruk): Sets => ({ type: v.inhoudstype, metCms: v.cms.length > 0, cms: new Set(v.cms), dom: new Set(v.dom), kop: new Set(v.kop) });

function gelijkenisSets(a: Sets, b: Sets): number {
  if (a.metCms !== b.metCms) return 0;
  if (a.type !== b.type) return 0;
  if (a.metCms) return 0.4 * jaccard(a.cms, b.cms) + 0.45 * jaccard(a.dom, b.dom) + 0.15 * jaccard(a.kop, b.kop);
  return 0.8 * jaccard(a.dom, b.dom) + 0.2 * jaccard(a.kop, b.kop);
}

export function gelijkenis(a: Vingerafdruk, b: Vingerafdruk): number {
  return gelijkenisSets(alsSets(a), alsSets(b));
}

/** Eén samenvoeging in de boom: groep i en j gaan samen op gelijkenis `hoogte`. */
interface Samenvoeging {
  i: number;
  j: number;
  hoogte: number;
}

export interface Dendrogram {
  paginas: ClusterInvoer[];
  samenvoegingen: Samenvoeging[];
  /** Gelijkenis tussen pagina's, voor de medoïde en de spreiding binnen een cluster. */
  sim: (x: number, y: number) => number;
}

/**
 * Bouw de boom. Pagina's met exact dezelfde vingerafdruk (gelijkenis 1) beginnen al als
 * één groep; dat maakt de rest veel sneller en verandert de uitkomst niet.
 */
export function bouwDendrogram(invoer: ClusterInvoer[], ondergrens = 0.5): Dendrogram {
  const paginas = [...invoer].sort((a, b) => a.urlNorm.localeCompare(b.urlNorm));
  const n = paginas.length;
  const S = new Float32Array(n * n);
  const sets = paginas.map((p) => alsSets(p.vingerafdruk));
  for (let x = 0; x < n; x++) {
    S[x * n + x] = 1;
    for (let y = x + 1; y < n; y++) {
      const s = gelijkenisSets(sets[x], sets[y]);
      S[x * n + y] = s;
      S[y * n + x] = s;
    }
  }
  const sim = (x: number, y: number) => S[x * n + y];

  // Groepen: elke pagina start als eigen groep. G[g] is de gelijkenis tussen groepen
  // (complete linkage = het minimum over alle paren).
  const actief = new Array<boolean>(n).fill(true);
  const G = new Float32Array(S);
  const samenvoegingen: Samenvoeging[] = [];
  for (;;) {
    let beste = -1;
    let bi = -1;
    let bj = -1;
    for (let i = 0; i < n; i++) {
      if (!actief[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (!actief[j]) continue;
        const s = G[i * n + j];
        if (s > beste) {
          beste = s;
          bi = i;
          bj = j;
        }
      }
    }
    if (bi < 0 || beste < ondergrens) break;
    samenvoegingen.push({ i: bi, j: bj, hoogte: beste });
    // j gaat op in i; de nieuwe afstand tot k is de kleinste van de twee.
    actief[bj] = false;
    for (let k = 0; k < n; k++) {
      if (!actief[k] || k === bi) continue;
      const s = Math.min(G[bi * n + k], G[bj * n + k]);
      G[bi * n + k] = s;
      G[k * n + bi] = s;
    }
  }
  return { paginas, samenvoegingen, sim };
}

export interface Cluster {
  /** Stabiele naam binnen deze snede: A, B, C ... op grootte, dan op representant. */
  naam: string;
  leden: string[];
  representant: string;
  /** Laagste en gemiddelde gelijkenis tussen de leden. */
  minimaal: number;
  gemiddeld: number;
  inhoudstype: string | null;
  componenten: string | null;
  /** Kenmerken die bij (bijna) alle leden voorkomen en op minder dan de helft van de site. */
  gedeeld: string[];
}

const naamVoor = (i: number) => {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

/** Snij de boom op een drempel. */
export function snij(d: Dendrogram, drempel: number): Cluster[] {
  const n = d.paginas.length;
  const ouder = Array.from({ length: n }, (_, i) => i);
  const vind = (x: number): number => (ouder[x] === x ? x : (ouder[x] = vind(ouder[x])));
  for (const s of d.samenvoegingen) {
    if (s.hoogte < drempel) break; // de hoogtes dalen bij complete linkage
    ouder[vind(s.j)] = vind(s.i);
  }
  const groepen = new Map<number, number[]>();
  for (let x = 0; x < n; x++) {
    const w = vind(x);
    if (!groepen.has(w)) groepen.set(w, []);
    groepen.get(w)!.push(x);
  }

  // Hoe vaak komt een leesbaar kenmerk op de hele site voor? Voor "gedeeld".
  const leesbaar = (v: Vingerafdruk) => [...v.cms, ...v.skelet.map((s) => `main>${s}`), ...v.kop.map((k) => `kop:${k}`)];
  const opSite = new Map<string, number>();
  for (const p of d.paginas) for (const k of new Set(leesbaar(p.vingerafdruk))) opSite.set(k, (opSite.get(k) || 0) + 1);

  const clusters = [...groepen.values()].map((leden) => {
    let min = 1;
    let som = 0;
    let paren = 0;
    let medoide = leden[0];
    let besteGem = -1;
    for (const x of leden) {
      let t = 0;
      for (const y of leden) {
        if (x === y) continue;
        const s = d.sim(x, y);
        t += s;
        if (x < y) {
          min = Math.min(min, s);
          som += s;
          paren++;
        }
      }
      const gem = leden.length > 1 ? t / (leden.length - 1) : 1;
      // Gelijke stand: de laagste index, dus de eerste op urlNorm.
      if (gem > besteGem) {
        besteGem = gem;
        medoide = x;
      }
    }
    const telling = new Map<string, number>();
    for (const x of leden) for (const k of new Set(leesbaar(d.paginas[x].vingerafdruk))) telling.set(k, (telling.get(k) || 0) + 1);
    const gedeeld = [...telling.entries()]
      .filter(([k, c]) => c >= Math.ceil(leden.length * 0.9) && (opSite.get(k) || 0) < n * 0.5)
      .map(([k]) => k)
      .sort();
    const rep = d.paginas[medoide].vingerafdruk;
    return {
      naam: '',
      leden: leden.map((x: number) => d.paginas[x].urlNorm),
      representant: d.paginas[medoide].urlNorm,
      minimaal: leden.length > 1 ? Math.round(min * 1000) / 1000 : 1,
      gemiddeld: paren ? Math.round((som / paren) * 1000) / 1000 : 1,
      inhoudstype: rep.inhoudstype,
      componenten: rep.componenten,
      gedeeld: gedeeld.slice(0, 12),
    };
  });
  clusters.sort((a, b) => b.leden.length - a.leden.length || a.representant.localeCompare(b.representant));
  clusters.forEach((c, i) => (c.naam = naamVoor(i)));
  return clusters;
}

/** Welke pagina's zitten bij drempel a in een andere groep dan bij drempel b? */
export function verschuivingen(a: Cluster[], b: Cluster[]): string[] {
  const groep = (cs: Cluster[]) => {
    const m = new Map<string, string>();
    for (const c of cs) {
      const sleutel = [...c.leden].sort().join('|');
      for (const u of c.leden) m.set(u, sleutel);
    }
    return m;
  };
  const A = groep(a);
  const B = groep(b);
  return [...A.keys()].filter((u) => A.get(u) !== B.get(u)).sort();
}
