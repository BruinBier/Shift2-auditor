/**
 * Zeef: loopt een lange lijst pagina's af en noteert per pagina waar iemand moet kijken.
 *
 * Voor een onderzoek op ALLE pagina's van een site (Valkenswaard-pagecheck, oktober 2026:
 * 1354 pagina's, elf criteria). Eén agent per pagina zou duizenden beurten kosten; deze zeef
 * opent elke pagina één keer, meet alle criteria in die ene laadbeurt (scripts/zeef/
 * meet-in-pagina.js) en schrijft per pagina één regel weg. Daarna wegen de agents alleen de
 * pagina's met een treffer, met de echte meetcommando's en audit-criterium.
 *
 * Een treffer is geen afkeuring. "Lees meer" met context in dezelfde alinea voldoet; een
 * lege alt kan juist goed zijn. De zeef keurt niets.
 *
 * Heeft geen database en geen dev-server nodig: alleen een browser en een lijst adressen.
 * Daarom kan hij ook in een cloud-sessie draaien. Hervat zichzelf: wat al in
 * resultaten.jsonl staat, slaat hij over.
 *
 *   npx tsx scripts/zeef-paginas.ts --invoer=exports/zeef/valkenswaard.nl/paginas.json
 *        [--uit=map] [--max=10] [--parallel=3] [--sitenaam="Gemeente Valkenswaard"]
 *   npx tsx scripts/zeef-paginas.ts --samenvatting --uit=map     # alleen de samenvatting opnieuw
 *   npx tsx scripts/zeef-paginas.ts --verzamel --invoer=... --uit=map
 *        # oordeelt niet: verzamelt alle koppen, linkteksten en alt-teksten (verzameld.jsonl),
 *        # om ze daarna per unieke tekst te wegen (scripts/zeef/verzamel-in-pagina.js)
 *
 * De invoer is een lijst `{ url, titel?, type? }`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getBrowser, openPage, type BrowserSession } from './lib/browser-fetch';
import { isHomepageUrl } from '../lib/audit-evidence';

type Flags = Record<string, string>;
const flags: Flags = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) flags[m[1]] = m[2] ?? 'true';
}

interface Invoer {
  url: string;
  titel?: string;
  type?: string;
}

const VERZAMEL = flags.verzamel === 'true';
const MEET = fs
  .readFileSync(path.join(__dirname, 'zeef', VERZAMEL ? 'verzamel-in-pagina.js' : 'meet-in-pagina.js'), 'utf-8')
  .trim();

// `technisch` is geen criterium: kapotte mail- en belkoppelingen, voor /technische-issues.
const CRITERIA = ['1.1.1', '1.3.1', '1.3.3', '1.4.1', '1.4.5', '1.4.11', '2.4.2', '2.4.4', '2.4.6', '2.5.3', '3.1.2', 'technisch'];

// Soorten treffers die bijna altijd in orde zijn. Ze blijven in resultaten.jsonl staan, maar
// maken een pagina niet tot kandidaat: anders staat elke pagina met "hieronder" op de lijst.
const ZWAK = new Set([
  'verwijzing naar boven of onder (meestal in orde)',
  'generieke tekst, met context in hetzelfde element',
  'lijst met één item (opmerking)',
  'titel noemt de h1 niet',
  'knop in de inhoud',
  'formuliervelden in de inhoud',
  'pictogram in link of knop in de inhoud',
  'ingesloten kader in de inhoud',
  'Engelse term (uitzondering of niet?)',
  'hero met lege alt (alleen een probleem als er tekst in staat)',
]);

function leesKlaar(bestand: string): Set<string> {
  const klaar = new Set<string>();
  if (!fs.existsSync(bestand)) return klaar;
  for (const regel of fs.readFileSync(bestand, 'utf-8').split('\n')) {
    if (!regel.trim()) continue;
    try {
      const r = JSON.parse(regel);
      // Een mislukte pagina telt niet als klaar: bij hervatten krijgt hij een nieuwe kans.
      if (!r.fout) klaar.add(r.url);
    } catch {
      // Een halve regel van een afgebroken run: overslaan, de pagina komt opnieuw.
    }
  }
  return klaar;
}

async function meetPagina(session: BrowserSession, item: Invoer, sitenaam: string) {
  const begin = Date.now();
  const { page, cleanup, eindUrl, omgeleid, dichtgeklapt, cookiesGeaccepteerd } = await openPage(session, item.url, 30000);
  try {
    const uitkomst: any = await page.evaluate(
      `(${MEET})(${JSON.stringify({ heelDePagina: isHomepageUrl(item.url), sitenaam })})`
    );
    const nietGevonden = /niet gevonden|404|bestaat niet/i.test(`${uitkomst.titel} ${uitkomst.h1}`);
    return {
      url: item.url,
      type: item.type || null,
      eindUrl,
      omgeleid,
      nietGevonden,
      modus: session.mode,
      dichtgeklapt: dichtgeklapt.aantal,
      // Op SIMsite is dat bijna altijd het menu en het toegankelijkheidsmenu (sjabloon). Een
      // uitklapblok in de inhoud zelf staat hier ook, en dan is die inhoud niet gemeten.
      dichtgeklaptVoorbeelden: dichtgeklapt.voorbeelden,
      cookiesGeaccepteerd: cookiesGeaccepteerd.length > 0,
      ms: Date.now() - begin,
      ...uitkomst,
    };
  } finally {
    await cleanup();
  }
}

function samenvatting(uitMap: string) {
  const regels = fs
    .readFileSync(path.join(uitMap, 'resultaten.jsonl'), 'utf-8')
    .split('\n')
    .filter((r) => r.trim())
    .map((r) => {
      try {
        return JSON.parse(r);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  // Bij hervatten kan een pagina twee keer voorkomen (eerst fout, dan gelukt): de laatste telt.
  const perUrl = new Map<string, any>();
  for (const r of regels) perUrl.set(r.url, r);
  const paginas = Array.from(perUrl.values());
  const gelukt = paginas.filter((p) => !p.fout);

  // 2.4.2 over pagina's heen: dezelfde titel op verschillende pagina's.
  const perTitel = new Map<string, string[]>();
  for (const p of gelukt) {
    const t = (p.titel || '').toLowerCase();
    if (!t) continue;
    perTitel.set(t, [...(perTitel.get(t) || []), p.url]);
  }
  for (const p of gelukt) {
    const zelfde = perTitel.get((p.titel || '').toLowerCase()) || [];
    if (zelfde.length > 1)
      p.treffers['2.4.2'].push({ soort: 'zelfde titel als een andere pagina', aantal: 1, voorbeelden: [{ titel: p.titel, ook: zelfde.filter((u) => u !== p.url).slice(0, 3) }] });
  }

  const perCriterium: Record<string, any> = {};
  for (const sc of CRITERIA) {
    const soorten = new Map<string, { paginas: number; aantal: number; voorbeelden: any[] }>();
    const kandidaten: { url: string; soorten: string[]; aantal: number }[] = [];
    for (const p of gelukt) {
      const lijst = (p.treffers?.[sc] || []) as any[];
      for (const t of lijst) {
        const s = soorten.get(t.soort) || { paginas: 0, aantal: 0, voorbeelden: [] };
        s.paginas++;
        s.aantal += t.aantal;
        if (s.voorbeelden.length < 5) s.voorbeelden.push({ url: p.url, ...t.voorbeelden[0] });
        soorten.set(t.soort, s);
      }
      const sterk = lijst.filter((t) => !ZWAK.has(t.soort));
      if (sterk.length) kandidaten.push({ url: p.url, soorten: sterk.map((t) => t.soort), aantal: sterk.reduce((n, t) => n + t.aantal, 0) });
    }
    kandidaten.sort((a, b) => b.aantal - a.aantal);
    perCriterium[sc] = {
      paginasMetTreffer: kandidaten.length,
      soorten: Object.fromEntries(Array.from(soorten.entries()).sort((a, b) => b[1].paginas - a[1].paginas)),
      kandidaten,
    };
  }

  // Heroplaatjes worden op veel pagina's hergebruikt. Per bestand één keer kijken of er
  // tekst in staat is genoeg; deze lijst zegt welke en op hoeveel pagina's.
  const legeAlt = new Map<string, { adres: string; soort: string; paginas: string[] }>();
  for (const p of gelukt)
    for (const t of (p.treffers?.['1.1.1'] || []) as any[])
      if (/lege alt/.test(t.soort) && !/link/.test(t.soort))
        for (const v of t.voorbeelden) {
          const e = legeAlt.get(v.src) || { adres: v.adres || v.src, soort: t.soort, paginas: [] };
          if (!e.paginas.includes(p.url)) e.paginas.push(p.url);
          legeAlt.set(v.src, e);
        }
  const afbeeldingenMetLegeAlt = Array.from(legeAlt.entries())
    .map(([src, e]) => ({ src, adres: e.adres, soort: e.soort, aantalPaginas: e.paginas.length, paginas: e.paginas.slice(0, 5) }))
    .sort((a, b) => b.aantalPaginas - a.aantalPaginas);

  const uit = {
    gemaakt: new Date().toISOString(),
    afbeeldingenMetLegeAlt,
    paginas: paginas.length,
    gelukt: gelukt.length,
    mislukt: paginas.filter((p) => p.fout).map((p) => ({ url: p.url, fout: p.fout })),
    nietGevonden: gelukt.filter((p) => p.nietGevonden).map((p) => p.url),
    omgeleid: gelukt.filter((p) => p.omgeleid).map((p) => ({ url: p.url, naar: p.eindUrl })),
    zonderMain: gelukt.filter((p) => p.geenMain).map((p) => p.url),
    headless: gelukt.filter((p) => p.modus === 'headless').length,
    metDichtgeklapteBlokken: gelukt.filter((p) => p.dichtgeklapt > 0).length,
    perCriterium,
  };
  fs.writeFileSync(path.join(uitMap, 'samenvatting.json'), JSON.stringify(uit, null, 2));

  const md: string[] = [
    `# Zeef: ${gelukt.length} van ${paginas.length} pagina's gemeten`,
    '',
    `Gemaakt ${uit.gemaakt}. Een treffer is een plek om te kijken, geen afkeuring.`,
    '',
    `- Mislukt: ${uit.mislukt.length}`,
    `- Pagina niet gevonden: ${uit.nietGevonden.length}`,
    `- Omgeleid: ${uit.omgeleid.length}`,
    `- Zonder main: ${uit.zonderMain.length}`,
    `- Headless gemeten: ${uit.headless} (dichtgeklapte blokken op ${uit.metDichtgeklapteBlokken} pagina's)`,
    `- Unieke afbeeldingen met lege alt om één keer te bekijken: ${afbeeldingenMetLegeAlt.length}`,
    '',
    '| Criterium | Pagina\'s met treffer | Meest voorkomend |',
    '|---|---|---|',
  ];
  for (const sc of CRITERIA) {
    const c = perCriterium[sc];
    const top = Object.entries(c.soorten)
      .slice(0, 3)
      .map(([s, v]: any) => `${s} (${v.paginas})`)
      .join('; ');
    md.push(`| ${sc} | ${c.paginasMetTreffer} | ${top || '-'} |`);
  }
  fs.writeFileSync(path.join(uitMap, 'samenvatting.md'), md.join('\n') + '\n');
  return uit;
}

async function main() {
  const uitMap = path.resolve(flags.uit || path.join('tmp', 'zeef', 'run'));
  fs.mkdirSync(uitMap, { recursive: true });
  if (flags.samenvatting === 'true') {
    const s = samenvatting(uitMap);
    console.log(JSON.stringify({ uitMap, gelukt: s.gelukt, mislukt: s.mislukt.length }, null, 2));
    return;
  }
  if (!flags.invoer) throw new Error('Geef --invoer=<bestand.json> mee: een lijst { url, titel?, type? }.');
  const lijst: Invoer[] = JSON.parse(fs.readFileSync(flags.invoer, 'utf-8'));
  const resultaten = path.join(uitMap, VERZAMEL ? 'verzameld.jsonl' : 'resultaten.jsonl');
  const klaar = leesKlaar(resultaten);
  let teDoen = lijst.filter((i) => !klaar.has(i.url));
  if (flags.max) teDoen = teDoen.slice(0, Number(flags.max));
  const parallel = Math.max(1, Number(flags.parallel || 3));
  const sitenaam = flags.sitenaam || '';
  process.stderr.write(`[zeef] ${lijst.length} in de invoer, ${klaar.size} al klaar, nu ${teDoen.length} te doen, ${parallel} tegelijk\n`);

  let session = await getBrowser();
  let gedaan = 0;
  let volgende = 0;
  const begin = Date.now();
  const werker = async () => {
    while (volgende < teDoen.length) {
      const item = teDoen[volgende++];
      let regel: any;
      try {
        regel = await meetPagina(session, item, sitenaam);
      } catch (err) {
        regel = { url: item.url, type: item.type || null, fout: String(err).slice(0, 300) };
        // Een afgesloten browser haalt alle volgende pagina's ook onderuit: opnieuw verbinden.
        if (/Target closed|Session closed|Connection closed|Protocol error/i.test(String(err))) {
          await session.dispose().catch(() => {});
          session = await getBrowser();
        }
      }
      fs.appendFileSync(resultaten, JSON.stringify(regel) + '\n');
      gedaan++;
      if (gedaan % 10 === 0 || gedaan === teDoen.length) {
        // Wandkloktijd per pagina: het parallel werken zit er al in.
        const perPagina = (Date.now() - begin) / gedaan;
        const rest = Math.round(((teDoen.length - gedaan) * perPagina) / 60000);
        process.stderr.write(`[zeef] ${gedaan}/${teDoen.length} — nog ongeveer ${rest} min\n`);
      }
    }
  };
  await Promise.all(Array.from({ length: parallel }, werker));
  await session.dispose();
  if (VERZAMEL) {
    console.log(JSON.stringify({ uitMap, bestand: resultaten, gedaan }, null, 2));
    return;
  }
  const s = samenvatting(uitMap);
  console.log(
    JSON.stringify(
      {
        uitMap,
        gelukt: s.gelukt,
        mislukt: s.mislukt.length,
        perCriterium: Object.fromEntries(CRITERIA.map((sc) => [sc, s.perCriterium[sc].paginasMetTreffer])),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
