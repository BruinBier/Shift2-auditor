import JSZip from 'jszip';
import { isGemeente, type GemeenteKey } from './videoPhases';

// Robuuste .xlsx-parser voor de A2-video-lijst.
//
// Waarom niet exceljs: de gebruikte lijst (video_overzicht_gemeentenA2.xlsx) schrijft cellen
// met de "x:"-namespace-prefix en tabellen die exceljs niet betrouwbaar leest. We parsen
// daarom het onderliggende sheet-XML direct.
//
// Verwacht formaat: een blad met kolomkoppen op rij 1. We zoeken de kolommen:
//   - "URL-alias" of "Url alias"  -> de video-URL (verplicht)
//   - "Medianaam" of "Titel"      -> de titel (optioneel; anders afgeleid uit de URL)
//   - "Gemeente"                  -> de gemeente per rij (optioneel; anders fallback-gemeente)

export interface ParsedVideoRow {
  gemeente: GemeenteKey;
  titel: string;
  url: string;
}

const GEMEENTE_LABEL_TO_KEY: Record<string, GemeenteKey> = {
  cranendonck: 'cranendonck',
  'heeze-leende': 'heeze_leende',
  heeze_leende: 'heeze_leende',
  valkenswaard: 'valkenswaard',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Kolomletter ("A", "AB") -> 1-based index.
function colToIndex(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function tempTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\/+/, '');
      if (id) return id;
    }
    const v = u.searchParams.get('v');
    if (v) return v;
  } catch {
    // niet-URL
  }
  return url;
}

// Parse één sheet-XML naar rijen van {colIndex: waarde}. Ondersteunt zowel <x:...> als <...>.
function parseSheetRows(xml: string): Map<number, Map<number, string>> {
  const rows = new Map<number, Map<number, string>>();
  const rowRe = /<(?:x:)?row[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/(?:x:)?row>/g;
  const cellRe = /<(?:x:)?c[^>]*\br="([A-Z]+)\d+"[^>]*?(?:\/>|>([\s\S]*?)<\/(?:x:)?c>)/g;
  const valRe = /<(?:x:)?(?:v|t)[^>]*>([\s\S]*?)<\/(?:x:)?(?:v|t)>/;

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowNum = parseInt(rowMatch[1], 10);
    const body = rowMatch[2] ?? '';
    const cells = new Map<number, string>();
    let cellMatch: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(body))) {
      const colIdx = colToIndex(cellMatch[1]);
      const inner = cellMatch[2] ?? '';
      const vm = inner.match(valRe);
      cells.set(colIdx, decodeEntities(vm ? vm[1] : '').trim());
    }
    rows.set(rowNum, cells);
  }
  return rows;
}

// Kies het beste blad: eerst een blad met een gemeente-kolom (bv. "Video-overzicht"),
// anders het eerste blad.
export async function parseVideoXlsx(
  buffer: Buffer,
  fallbackGemeente?: string
): Promise<{ rows: ParsedVideoRow[]; usedGemeenteColumn: boolean; error?: string }> {
  const zip = await JSZip.loadAsync(buffer);

  const sheetPaths = Object.keys(zip.files)
    .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p))
    .sort();

  if (sheetPaths.length === 0) {
    return { rows: [], usedGemeenteColumn: false, error: 'geen werkbladen gevonden in het bestand' };
  }

  // Zoek het blad met de meeste bruikbare data (bij voorkeur met gemeente-kolom).
  let best: { rows: ParsedVideoRow[]; usedGemeenteColumn: boolean } | null = null;

  for (const path of sheetPaths) {
    const xml = await zip.files[path].async('string');
    const rowMap = parseSheetRows(xml);
    const header = rowMap.get(1);
    if (!header) continue;

    let urlCol = -1;
    let titelCol = -1;
    let gemeenteCol = -1;
    for (const [idx, val] of header) {
      const h = val.toLowerCase().replace(/\s+/g, ' ').trim();
      if (h === 'url-alias' || h === 'url alias') urlCol = idx;
      else if (h === 'medianaam' || h === 'titel') titelCol = idx;
      else if (h === 'gemeente') gemeenteCol = idx;
    }
    if (urlCol === -1) continue;

    const rows: ParsedVideoRow[] = [];
    const rowNums = [...rowMap.keys()].filter((n) => n > 1).sort((a, b) => a - b);
    for (const rn of rowNums) {
      const cells = rowMap.get(rn)!;
      const url = (cells.get(urlCol) ?? '').trim();
      if (!url) continue;

      let gemeente: GemeenteKey | undefined;
      if (gemeenteCol !== -1) {
        const label = (cells.get(gemeenteCol) ?? '').toLowerCase().trim();
        gemeente = GEMEENTE_LABEL_TO_KEY[label];
      }
      if (!gemeente && isGemeente(fallbackGemeente)) gemeente = fallbackGemeente;
      if (!gemeente) continue; // geen gemeente te bepalen -> sla rij over

      const titel = titelCol !== -1 ? (cells.get(titelCol) ?? '').trim() : '';
      rows.push({ gemeente, titel: titel || tempTitleFromUrl(url), url });
    }

    const candidate = { rows, usedGemeenteColumn: gemeenteCol !== -1 };
    if (!best || candidate.rows.length > best.rows.length) best = candidate;
  }

  if (!best) {
    return {
      rows: [],
      usedGemeenteColumn: false,
      error: 'kolom "URL-alias" niet gevonden in het bestand',
    };
  }
  return best;
}
