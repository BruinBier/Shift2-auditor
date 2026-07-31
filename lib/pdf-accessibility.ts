import { inflateSync } from 'zlib';
import {
  PDFArray,
  PDFContext,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFStream,
  PDFString,
} from 'pdf-lib';

/**
 * Repareert de tagstructuur van een door Chrome gegenereerde PDF, zodat het
 * bestand voldoet aan PDF/UA.
 *
 * Chrome neemt de semantiek uit de HTML al goed over (koppen, TH-cellen met
 * scope, lijsten), maar laat een aantal dingen liggen die PDF/UA wel eist:
 *
 *   1. Koprijen staan los in de tabel; ze horen in een THead-groep.
 *   2. LI-elementen missen de verplichte LBody-wikkel.
 *   3. Link-annotaties missen /Contents, het Link-element mist /Alt.
 *   4. Er is geen XMP-metadata met pdfuaid:part, titel en taal.
 */

/** Beschrijvende linktekst per WCAG-succescriterium. */
const WCAG_SLUG_LABELS: Record<string, string> = {
  'non-text-content': '1.1.1 Niet-tekstuele content',
  'audio-only-and-video-only-prerecorded':
    '1.2.1 Louter-geluid en louter-videobeeld (vooraf opgenomen)',
  'captions-prerecorded': '1.2.2 Ondertitels voor doven en slechthorenden (vooraf opgenomen)',
  'audio-description-or-media-alternative-prerecorded':
    '1.2.3 Audiodescriptie of media-alternatief (vooraf opgenomen)',
  'captions-live': '1.2.4 Ondertitels voor doven en slechthorenden (live)',
  'audio-description-prerecorded': '1.2.5 Audiodescriptie (vooraf opgenomen)',
  'info-and-relationships': '1.3.1 Info en relaties',
  'meaningful-sequence': '1.3.2 Betekenisvolle volgorde',
  'sensory-characteristics': '1.3.3 Zintuiglijke eigenschappen',
  'identify-input-purpose': '1.3.5 Identificeer het doel van de input',
  'use-of-color': '1.4.1 Gebruik van kleur',
  'contrast-minimum': '1.4.3 Contrast (minimum)',
  'resize-text': '1.4.4 Herschalen van tekst',
  'images-of-text': '1.4.5 Afbeeldingen van tekst',
  reflow: '1.4.10 Reflow',
  'non-text-contrast': '1.4.11 Contrast van niet-tekstuele content',
  'text-spacing': '1.4.12 Tekstafstand',
  'content-on-hover-or-focus': '1.4.13 Content bij hover of focus',
  keyboard: '2.1.1 Toetsenbord',
  'no-keyboard-trap': '2.1.2 Geen toetsenbordval',
  'bypass-blocks': '2.4.1 Blokken omzeilen',
  'page-titled': '2.4.2 Paginatitel',
  'focus-order': '2.4.3 Focus volgorde',
  'link-purpose-in-context': '2.4.4 Linkdoel (in context)',
  'multiple-ways': '2.4.5 Meerdere manieren',
  'headings-and-labels': '2.4.6 Koppen en labels',
  'focus-visible': '2.4.7 Focus zichtbaar',
  'label-in-name': '2.5.3 Label in naam',
  'language-of-page': '3.1.1 Taal van de pagina',
  'language-of-parts': '3.1.2 Taal van onderdelen',
  'on-focus': '3.2.1 Bij focus',
  'on-input': '3.2.2 Bij input',
  'consistent-navigation': '3.2.3 Consistente navigatie',
  'consistent-identification': '3.2.4 Consistente identificatie',
  'error-identification': '3.3.1 Foutidentificatie',
  'labels-or-instructions': '3.3.2 Labels of instructies',
  'error-suggestion': '3.3.3 Foutsuggestie',
  parsing: '4.1.1 Parsen',
  'name-role-value': '4.1.2 Naam, rol en waarde',
  'status-messages': '4.1.3 Statusberichten',
};

const WCAG_URL_LABELS: Record<string, string> = {
  'https://www.w3.org/Translations/WCAG22-nl': 'WCAG 2.2 (Nederlandse vertaling)',
  'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em':
    'WCAG-EM: methode voor toegankelijkheidsonderzoek',
  'https://www.digitoegankelijk.nl': 'Digitoegankelijk.nl',
  'https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek':
    'Digitoegankelijk.nl: onderzoek voor de toegankelijkheidsverklaring',
};

/** Leesbare tekst voor een WCAG-verwijzing, of null als het geen WCAG-link is. */
function wcagLabelFor(uri: string): string | null {
  const bare = uri.replace(/\/$/, '');
  if (WCAG_URL_LABELS[bare]) return WCAG_URL_LABELS[bare];

  const understanding = uri.match(/\/Understanding\/([a-z0-9-]+)\.html$/i);
  if (understanding) return WCAG_SLUG_LABELS[understanding[1]] ?? null;

  const translated = uri.match(/\/WCAG22-nl\/?#([a-z0-9-]+)$/i);
  if (translated) return WCAG_SLUG_LABELS[translated[1]] ?? null;

  return null;
}

function asDict(value: unknown, context: PDFContext): PDFDict | null {
  if (value instanceof PDFDict) return value;
  if (value instanceof PDFRef) {
    const looked = context.lookup(value);
    return looked instanceof PDFDict ? looked : null;
  }
  return null;
}

function structType(node: PDFDict): string {
  const s = node.get(PDFName.of('S'));
  return s instanceof PDFName ? s.asString() : '';
}

/** Loop de structuurboom af en roep `visit` aan voor elk element. */
function walkStructTree(
  node: PDFDict,
  context: PDFContext,
  visit: (n: PDFDict) => void,
  depth = 0,
  seen = new Set<PDFDict>(),
): void {
  if (depth > 60 || seen.has(node)) return;
  seen.add(node);
  visit(node);

  const kids = node.get(PDFName.of('K'));
  const items =
    kids instanceof PDFArray ? kids.asArray() : kids === undefined ? [] : [kids];

  for (const item of items) {
    const child = asDict(item, context);
    if (child && child.get(PDFName.of('S')) !== undefined) {
      walkStructTree(child, context, visit, depth + 1, seen);
    }
  }
}

/**
 * Koprijen in een THead-groep zetten.
 *
 * Chrome zet elke TR direct onder de Table. PDF/UA verwacht dat de rijen die
 * alleen kopcellen bevatten in een THead staan; datarijen horen in een TBody.
 */
function groupTableHeaders(table: PDFDict, context: PDFContext): boolean {
  const kids = table.get(PDFName.of('K'));
  if (!(kids instanceof PDFArray)) return false;

  const rows: Array<{ ref: unknown; dict: PDFDict }> = [];
  for (const item of kids.asArray()) {
    const dict = asDict(item, context);
    if (dict && structType(dict) === '/TR') rows.push({ ref: item, dict });
  }
  if (rows.length === 0) return false;

  // Een koprij bevat uitsluitend TH-cellen.
  const isHeaderRow = (row: PDFDict): boolean => {
    const cells = row.get(PDFName.of('K'));
    const list =
      cells instanceof PDFArray ? cells.asArray() : cells === undefined ? [] : [cells];
    const types = list
      .map((c) => asDict(c, context))
      .filter((c): c is PDFDict => c !== null)
      .map(structType);
    return types.length > 0 && types.every((t) => t === '/TH');
  };

  const headerRows = rows.filter((r) => isHeaderRow(r.dict));
  const bodyRows = rows.filter((r) => !isHeaderRow(r.dict));
  if (headerRows.length === 0 || bodyRows.length === 0) return false;

  const tableRef = context.getObjectRef(table);

  const makeGroup = (type: string, group: typeof rows): PDFRef => {
    const dict = context.obj({ Type: 'StructElem', S: type });
    const arr = PDFArray.withContext(context);
    for (const r of group) arr.push(r.ref as never);
    dict.set(PDFName.of('K'), arr);
    if (tableRef) dict.set(PDFName.of('P'), tableRef);
    return context.register(dict);
  };

  const theadRef = makeGroup('THead', headerRows);
  const tbodyRef = makeGroup('TBody', bodyRows);

  for (const r of headerRows) r.dict.set(PDFName.of('P'), theadRef);
  for (const r of bodyRows) r.dict.set(PDFName.of('P'), tbodyRef);

  const tableKids = PDFArray.withContext(context);
  tableKids.push(theadRef);
  tableKids.push(tbodyRef);
  table.set(PDFName.of('K'), tableKids);
  return true;
}

/** LI-elementen voorzien van de verplichte LBody-wikkel. */
function wrapListItem(li: PDFDict, context: PDFContext): boolean {
  const kids = li.get(PDFName.of('K'));
  const items =
    kids instanceof PDFArray ? kids.asArray() : kids === undefined ? [] : [kids];

  const hasLBody = items.some((item) => {
    const dict = asDict(item, context);
    return dict !== null && structType(dict) === '/LBody';
  });
  if (hasLBody || items.length === 0) return false;

  const liRef = context.getObjectRef(li);
  const pg = li.get(PDFName.of('Pg'));

  // Lbl (opsommingsteken) blijft direct onder LI; de rest gaat in LBody.
  const labels: unknown[] = [];
  const body: unknown[] = [];
  for (const item of items) {
    const dict = asDict(item, context);
    if (dict && structType(dict) === '/Lbl') labels.push(item);
    else body.push(item);
  }
  if (body.length === 0) return false;

  const lbody = context.obj({ Type: 'StructElem', S: 'LBody' });
  const bodyArr = PDFArray.withContext(context);
  for (const item of body) bodyArr.push(item as never);
  lbody.set(PDFName.of('K'), bodyArr);
  if (liRef) lbody.set(PDFName.of('P'), liRef);
  if (pg !== undefined) lbody.set(PDFName.of('Pg'), pg as never);
  const lbodyRef = context.register(lbody);

  for (const item of body) {
    const dict = asDict(item, context);
    if (dict && dict.get(PDFName.of('S')) !== undefined) {
      dict.set(PDFName.of('P'), lbodyRef);
    }
  }

  const liKids = PDFArray.withContext(context);
  for (const label of labels) liKids.push(label as never);
  liKids.push(lbodyRef);
  li.set(PDFName.of('K'), liKids);
  return true;
}

export interface PdfAccessibilityOptions {
  /** Documenttitel; komt in de XMP-metadata en de documenteigenschappen. */
  title: string;
  /** Taalcode, bijvoorbeeld "nl-NL". */
  language?: string;
  /**
   * Tekstalternatief voor afbeeldingen die Chrome niet zelf tagt. Meestal
   * alleen het logo in de header; het alt-attribuut uit de HTML.
   */
  imageAltText?: string;
}

export interface PdfAccessibilityResult {
  pdf: Uint8Array;
  stats: {
    tablesGrouped: number;
    listItemsWrapped: number;
    linksLabelled: number;
    wcagLinksLabelled: number;
    imagesTagged: number;
  };
}

/**
 * Ongetagde afbeeldingen alsnog als Figure taggen, met tekstalternatief.
 *
 * Chrome tagt een afbeelding in een header-landmark niet; die valt dan buiten
 * de structuurboom en is voor hulpsoftware onzichtbaar. Dat is een PDF/UA-fout.
 * We wikkelen de afbeelding daarom in een gemarkeerde inhoud (BDC met MCID) en
 * hangen er een Figure-element aan met /Alt en een begrenzingsvlak.
 */
function tagUntaggedImages(
  doc: PDFDocument,
  context: PDFContext,
  altTexts: Map<string, string>,
  defaultAlt: string,
): number {
  let tagged = 0;

  const structRoot = asDict(doc.catalog.get(PDFName.of('StructTreeRoot')), context);
  if (!structRoot) return 0;

  const documentEl = (() => {
    const k = structRoot.get(PDFName.of('K'));
    const items = k instanceof PDFArray ? k.asArray() : k === undefined ? [] : [k];
    for (const item of items) {
      const dict = asDict(item, context);
      if (dict && structType(dict) === '/Document') return dict;
    }
    return items.length ? asDict(items[0], context) : null;
  })();
  if (!documentEl) return 0;

  for (const page of doc.getPages()) {
    const resources = asDict(page.node.get(PDFName.of('Resources')), context);
    const xobjects = asDict(resources?.get(PDFName.of('XObject')), context);
    if (!xobjects) continue;

    const imageNames = xobjects
      .keys()
      .map((key) => key.asString())
      .filter((name) => {
        const xobj = context.lookup(xobjects.get(PDFName.of(name.slice(1))));
        if (!(xobj instanceof PDFStream)) return false;
        const subtype = xobj.dict.get(PDFName.of('Subtype'));
        return subtype instanceof PDFName && subtype.asString() === '/Image';
      });
    if (imageNames.length === 0) continue;

    const contents = page.node.get(PDFName.of('Contents'));
    const streams: PDFStream[] = [];
    if (contents instanceof PDFArray) {
      for (const item of contents.asArray()) {
        const s = context.lookup(item);
        if (s instanceof PDFStream) streams.push(s);
      }
    } else {
      const s = contents instanceof PDFRef ? context.lookup(contents) : contents;
      if (s instanceof PDFStream) streams.push(s);
    }

    const pageRef = context.getObjectRef(page.node);
    const newFigures: Array<{ mcid: number; name: string }> = [];

    // Hoogste bestaande MCID op deze pagina bepalen; nieuwe markeringen tellen
    // daarboven verder zodat ze niet botsen met wat Chrome al heeft getagd.
    let nextMcid = 0;

    for (const stream of streams) {
      // Content streams zijn doorgaans Flate-gecomprimeerd; eerst uitpakken,
      // anders vindt de tekstvervanging hieronder niets.
      let raw = Buffer.from(stream.getContents());
      const filter = stream.dict.get(PDFName.of('Filter'));
      const isFlate =
        filter instanceof PDFName && filter.asString() === '/FlateDecode';
      if (isFlate) {
        try {
          raw = Buffer.from(inflateSync(raw));
        } catch {
          continue;
        }
      }

      let text = raw.toString('latin1');
      const mcidPattern = /\/MCID\s+(\d+)/g;
      let mcidMatch: RegExpExecArray | null;
      while ((mcidMatch = mcidPattern.exec(text)) !== null) {
        nextMcid = Math.max(nextMcid, Number(mcidMatch[1]) + 1);
      }

      let changed = false;

      for (const name of imageNames) {
        const pattern = new RegExp(`${escapeRegExp(name)}\\s+Do`, 'g');
        text = text.replace(pattern, (match, offset: number) => {
          // Staat de aanroep al binnen een BDC/BMC-blok? Dan is hij getagd.
          const before = text.slice(0, offset);
          const opens = (before.match(/\b(?:BDC|BMC)\b/g) ?? []).length;
          const closes = (before.match(/\bEMC\b/g) ?? []).length;
          if (opens > closes) return match;

          const mcid = nextMcid++;
          newFigures.push({ mcid, name });
          changed = true;
          return `/Figure <</MCID ${mcid}>> BDC\n${match}\nEMC`;
        });
      }

      if (changed) {
        stream.dict.delete(PDFName.of('Filter'));
        (stream as unknown as { contents: Uint8Array }).contents = Uint8Array.from(
          Buffer.from(text, 'latin1'),
        );
        stream.dict.set(
          PDFName.of('Length'),
          context.obj(Buffer.byteLength(text, 'latin1')),
        );
      }
    }

    if (newFigures.length === 0) continue;

    // De pagina moet een StructParents-nummer hebben om de markeringen aan de
    // structuurboom te kunnen koppelen.
    let structParents = page.node.get(PDFName.of('StructParents'));
    const parentTree = asDict(structRoot.get(PDFName.of('ParentTree')), context);
    const nums = parentTree?.get(PDFName.of('Nums'));
    if (!(nums instanceof PDFArray)) continue;

    if (!(structParents instanceof PDFNumber)) {
      const nextKey = ((): number => {
        let max = -1;
        const arr = nums.asArray();
        for (let i = 0; i < arr.length; i += 2) {
          const key = context.lookupMaybe(arr[i], PDFNumber);
          if (key) max = Math.max(max, key.asNumber());
        }
        return max + 1;
      })();
      structParents = context.obj(nextKey) as PDFNumber;
      page.node.set(PDFName.of('StructParents'), structParents);

      const entries = PDFArray.withContext(context);
      nums.push(context.obj(nextKey));
      nums.push(entries);
    }

    const spKey = (structParents as PDFNumber).asNumber();

    // De rij met MCID-verwijzingen voor deze pagina opzoeken.
    let mcidRow: PDFArray | null = null;
    const arr = nums.asArray();
    for (let i = 0; i < arr.length; i += 2) {
      const key = context.lookupMaybe(arr[i], PDFNumber);
      if (key?.asNumber() === spKey) {
        const value = context.lookupMaybe(arr[i + 1], PDFArray);
        if (value) mcidRow = value;
        break;
      }
    }
    if (!mcidRow) continue;

    for (const fig of newFigures) {
      const alt = altTexts.get(fig.name) ?? defaultAlt;
      const figure = context.obj({ Type: 'StructElem', S: 'Figure' });
      figure.set(PDFName.of('Alt'), PDFString.of(alt));
      figure.set(PDFName.of('K'), context.obj(fig.mcid));
      if (pageRef) figure.set(PDFName.of('Pg'), pageRef);

      const documentRef = context.getObjectRef(documentEl);
      if (documentRef) figure.set(PDFName.of('P'), documentRef);

      const figureRef = context.register(figure);

      // Figure vooraan in het document zetten: het logo staat bovenaan pagina 1.
      // /K kan zowel een array als één enkele verwijzing zijn.
      const docKids = documentEl.get(PDFName.of('K'));
      const rebuilt = PDFArray.withContext(context);
      rebuilt.push(figureRef);
      if (docKids instanceof PDFArray) {
        for (const item of docKids.asArray()) rebuilt.push(item as never);
      } else if (docKids !== undefined) {
        rebuilt.push(docKids as never);
      }
      documentEl.set(PDFName.of('K'), rebuilt);

      // ParentTree: op de plek van deze MCID naar het Figure verwijzen.
      while (mcidRow.size() <= fig.mcid) {
        mcidRow.push(context.obj(null) as never);
      }
      mcidRow.set(fig.mcid, figureRef);

      tagged += 1;
    }
  }

  return tagged;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Maak een getagde PDF PDF/UA-conform.
 */
export async function makePdfAccessible(
  input: Uint8Array,
  options: PdfAccessibilityOptions,
): Promise<PdfAccessibilityResult> {
  const doc = await PDFDocument.load(input, { updateMetadata: false });
  const context = doc.context;
  const language = options.language ?? 'nl-NL';

  const stats = {
    tablesGrouped: 0,
    listItemsWrapped: 0,
    linksLabelled: 0,
    wcagLinksLabelled: 0,
    imagesTagged: 0,
  };

  // ── Structuurboom bijwerken ────────────────────────────────
  const catalog = doc.catalog;
  const structRoot = asDict(catalog.get(PDFName.of('StructTreeRoot')), context);

  if (structRoot) {
    const tables: PDFDict[] = [];
    const listItems: PDFDict[] = [];

    const rootKids = structRoot.get(PDFName.of('K'));
    const rootNodes =
      rootKids instanceof PDFArray
        ? rootKids.asArray()
        : rootKids === undefined
          ? []
          : [rootKids];

    for (const item of rootNodes) {
      const node = asDict(item, context);
      if (!node) continue;
      walkStructTree(node, context, (n) => {
        const type = structType(n);
        if (type === '/Table') tables.push(n);
        else if (type === '/LI') listItems.push(n);
      });
    }

    for (const table of tables) {
      if (groupTableHeaders(table, context)) stats.tablesGrouped += 1;
    }
    for (const li of listItems) {
      if (wrapListItem(li, context)) stats.listItemsWrapped += 1;
    }

    stats.imagesTagged = tagUntaggedImages(
      doc,
      context,
      new Map(),
      options.imageAltText ?? 'Logo',
    );
  }

  // ── Link-annotaties van een beschrijving voorzien ──────────
  // Zonder /Contents heeft een link geen toegankelijke naam.
  const structParentToLabel = new Map<number, string>();

  for (const page of doc.getPages()) {
    const annots = page.node.get(PDFName.of('Annots'));
    if (!(annots instanceof PDFArray)) continue;

    for (const item of annots.asArray()) {
      const annot = asDict(item, context);
      if (!annot) continue;

      const subtype = annot.get(PDFName.of('Subtype'));
      if (!(subtype instanceof PDFName) || subtype.asString() !== '/Link') continue;

      const action = asDict(annot.get(PDFName.of('A')), context);
      const uriObj = action?.get(PDFName.of('URI'));
      const uri =
        uriObj instanceof PDFString || uriObj instanceof PDFHexString
          ? uriObj.decodeText()
          : '';
      if (!uri) continue;

      const wcagLabel = wcagLabelFor(uri);
      const label = wcagLabel ?? uri;
      if (wcagLabel) stats.wcagLinksLabelled += 1;

      annot.set(PDFName.of('Contents'), PDFString.of(label));
      stats.linksLabelled += 1;

      const sp = annot.get(PDFName.of('StructParent'));
      if (sp instanceof PDFNumber) {
        structParentToLabel.set(sp.asNumber(), label);
      }
    }
  }

  // /Alt op het Link-element, maar alleen als het iets toevoegt: is de
  // linktekst zelf al de URL, dan leest hulpsoftware het anders dubbel voor.
  if (structRoot) {
    const rootKids = structRoot.get(PDFName.of('K'));
    const rootNodes =
      rootKids instanceof PDFArray
        ? rootKids.asArray()
        : rootKids === undefined
          ? []
          : [rootKids];

    for (const item of rootNodes) {
      const node = asDict(item, context);
      if (!node) continue;
      walkStructTree(node, context, (n) => {
        if (structType(n) !== '/Link') return;

        const kids = n.get(PDFName.of('K'));
        const items =
          kids instanceof PDFArray ? kids.asArray() : kids === undefined ? [] : [kids];

        for (const kid of items) {
          const objr = asDict(kid, context);
          if (!objr) continue;
          const type = objr.get(PDFName.of('Type'));
          if (!(type instanceof PDFName) || type.asString() !== '/OBJR') continue;

          const target = asDict(objr.get(PDFName.of('Obj')), context);
          const sp = target?.get(PDFName.of('StructParent'));
          if (!(sp instanceof PDFNumber)) continue;

          const label = structParentToLabel.get(sp.asNumber());
          if (label && !/^https?:\/\//i.test(label)) {
            n.set(PDFName.of('Alt'), PDFString.of(label));
          }
        }
      });
    }
  }

  // ── Documenteigenschappen en markering ─────────────────────
  catalog.set(PDFName.of('Lang'), PDFString.of(language));

  const markInfo = context.obj({ Marked: true });
  catalog.set(PDFName.of('MarkInfo'), markInfo);

  const viewerPrefs =
    asDict(catalog.get(PDFName.of('ViewerPreferences')), context) ??
    context.obj({});
  viewerPrefs.set(PDFName.of('DisplayDocTitle'), context.obj(true));
  catalog.set(PDFName.of('ViewerPreferences'), viewerPrefs);

  doc.setTitle(options.title);
  doc.setLanguage(language);

  // ── XMP-metadata met pdfuaid:part ──────────────────────────
  // Als UTF-8 bytes doorgeven: een string wordt als Latin-1 gecodeerd, waardoor
  // de byte-order mark en accenten stuk gaan en de XMP onleesbaar wordt.
  const xmp = new TextEncoder().encode(buildXmp(options.title, language));
  const metadataStream = context.stream(xmp, {
    Type: 'Metadata',
    Subtype: 'XML',
  });
  catalog.set(PDFName.of('Metadata'), context.register(metadataStream));

  const pdf = await doc.save({ useObjectStreams: false });
  return { pdf, stats };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildXmp(title: string, language: string): string {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
        xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:language>
        <rdf:Bag>
          <rdf:li>${escapeXml(language)}</rdf:li>
        </rdf:Bag>
      </dc:language>
      <pdf:Producer>Shift2 Auditor</pdf:Producer>
      <pdfuaid:part>1</pdfuaid:part>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
