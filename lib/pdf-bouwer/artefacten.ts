import { inflateSync } from 'zlib';
import { PDFArray, PDFDocument, PDFName, PDFRef, PDFStream } from 'pdf-lib';

/**
 * Alles wat Chrome niet markeert als artefact markeren.
 *
 * PDF/UA eist dat elke tekening op een pagina óf bij een tag hoort, óf als artefact is
 * gemarkeerd. Chrome tagt de inhoud, maar laat een paar dingen los staan: het paginanummer
 * uit de voettekst, een decoratieve afbeelding (alt=""), en de achtergrondvlakken van
 * tabelkoppen. Die zijn inderdaad geen inhoud, maar ongemarkeerd keurt PAC ze af.
 *
 * Werkwijze: de inhoud van elke pagina tokeniseren, bijhouden hoe diep we in een BDC/BMC
 * zitten, en elke reeks tekeninstructies op diepte 0 omringen met `/Artifact BMC ... EMC`.
 * Er wordt alleen tekst ingevoegd; de bestaande bytes blijven zoals ze waren.
 *
 * Een reeks breekt bij BT en ET: een gemarkeerd stuk mag niet half in een tekstobject
 * beginnen en erbuiten eindigen.
 */

/** Instructies die iets op de pagina zetten. Alleen reeksen met zo'n instructie worden verpakt. */
const TEKENEN = new Set([
  'Tj', 'TJ', "'", '"', 'Do', 'sh', 'EI',
  'f', 'F', 'f*', 'B', 'B*', 'b', 'b*', 'S', 's',
]);

interface Op {
  naam: string;
  /** Begin van de eerste operand (of van de instructie zelf als er geen operanden zijn). */
  start: number;
  /** Direct na de instructie. */
  eind: number;
}

const WIT = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const SCHEIDING = new Set('()<>[]{}/%'.split('').map((c) => c.charCodeAt(0)));

/** De instructies in een contentstream, met hun plek. Operanden worden overgeslagen. */
export function instructies(s: string): Op[] {
  const ops: Op[] = [];
  let i = 0;
  let operandStart = -1;
  const n = s.length;
  const code = (k: number) => s.charCodeAt(k);

  while (i < n) {
    const c = code(i);
    if (WIT.has(c)) {
      i++;
      continue;
    }
    if (c === 0x25 /* % */) {
      while (i < n && code(i) !== 0x0a && code(i) !== 0x0d) i++;
      continue;
    }

    const tokenStart = i;
    if (c === 0x28 /* ( */) {
      let diepte = 0;
      for (; i < n; i++) {
        const k = code(i);
        if (k === 0x5c /* \ */) {
          i++;
          continue;
        }
        if (k === 0x28) diepte++;
        else if (k === 0x29 && --diepte === 0) {
          i++;
          break;
        }
      }
    } else if (c === 0x3c /* < */) {
      if (code(i + 1) === 0x3c) i += 2;
      else {
        while (i < n && code(i) !== 0x3e) i++;
        i++;
      }
    } else if (c === 0x3e /* > */) {
      i += code(i + 1) === 0x3e ? 2 : 1;
    } else if (c === 0x5b || c === 0x5d || c === 0x7b || c === 0x7d) {
      i++;
    } else if (c === 0x2f /* / */) {
      i++;
      while (i < n && !WIT.has(code(i)) && !SCHEIDING.has(code(i))) i++;
    } else {
      while (i < n && !WIT.has(code(i)) && !SCHEIDING.has(code(i))) i++;
      const woord = s.slice(tokenStart, i);
      const isOperand = /^[+-]?(\d+\.?\d*|\.\d+)$/.test(woord) || woord === 'true' || woord === 'false' || woord === 'null';
      if (!isOperand) {
        ops.push({ naam: woord, start: operandStart >= 0 ? operandStart : tokenStart, eind: i });
        operandStart = -1;
        if (woord === 'ID') {
          // Inline afbeelding: ruwe gegevens tot aan "EI" tussen witruimte.
          const m = /\sEI(?=[\s]|$)/g;
          m.lastIndex = i + 1;
          const hit = m.exec(s);
          const eind = hit ? hit.index + 3 : n;
          ops.push({ naam: 'EI', start: i, eind });
          i = eind;
        }
        continue;
      }
    }
    if (operandStart < 0) operandStart = tokenStart;
  }
  return ops;
}

/** Voeg de artefactmarkeringen in; geeft de nieuwe tekst en het aantal verpakte reeksen. */
export function markeerLosseInhoud(s: string): { tekst: string; aantal: number } {
  const ops = instructies(s);
  const invoegingen: Array<{ plek: number; tekst: string }> = [];
  let diepte = 0;
  let reeks: Op[] = [];

  const sluit = () => {
    if (reeks.some((o) => TEKENEN.has(o.naam))) {
      invoegingen.push({ plek: reeks[0].start, tekst: '/Artifact BMC\n' });
      invoegingen.push({ plek: reeks[reeks.length - 1].eind, tekst: '\nEMC' });
    }
    reeks = [];
  };

  for (const op of ops) {
    if (op.naam === 'BDC' || op.naam === 'BMC') {
      if (diepte === 0) sluit();
      diepte++;
    } else if (op.naam === 'EMC') {
      diepte = Math.max(0, diepte - 1);
    } else if (diepte === 0) {
      if (op.naam === 'BT' || op.naam === 'ET') sluit();
      else reeks.push(op);
    }
  }
  sluit();

  if (invoegingen.length === 0) return { tekst: s, aantal: 0 };
  let uit = '';
  let vanaf = 0;
  for (const inv of invoegingen) {
    uit += s.slice(vanaf, inv.plek) + inv.tekst;
    vanaf = inv.plek;
  }
  uit += s.slice(vanaf);
  return { tekst: uit, aantal: invoegingen.length / 2 };
}

/** Pas `markeerLosseInhoud` toe op elke pagina van een PDF. */
export async function markeerArtefacten(pdf: Uint8Array): Promise<{ pdf: Uint8Array; aantal: number }> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const ctx = doc.context;
  let aantal = 0;

  for (const page of doc.getPages()) {
    const contents = page.node.get(PDFName.of('Contents'));
    const refs = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : [];
    for (const ref of refs) {
      const stream = ref instanceof PDFRef ? ctx.lookup(ref) : ref;
      if (!(stream instanceof PDFStream)) continue;

      let bytes = Buffer.from(stream.getContents());
      const filter = stream.dict.get(PDFName.of('Filter'));
      if (filter instanceof PDFName && filter.asString() === '/FlateDecode') bytes = inflateSync(bytes);
      else if (filter !== undefined) continue; // een ander filter laten we met rust

      const { tekst, aantal: n } = markeerLosseInhoud(bytes.toString('latin1'));
      if (n === 0) continue;
      aantal += n;

      const nieuw = ctx.flateStream(Buffer.from(tekst, 'latin1'));
      if (ref instanceof PDFRef) ctx.assign(ref, nieuw);
      else page.node.set(PDFName.of('Contents'), ctx.register(nieuw));
    }
  }

  return { pdf: await doc.save({ useObjectStreams: false }), aantal };
}
