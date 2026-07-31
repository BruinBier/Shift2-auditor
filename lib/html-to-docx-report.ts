import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

/**
 * Zet de gegenereerde rapport-HTML om naar een toegankelijk Word-document.
 *
 * De HTML uit `generate-report-html.ts` is de enige bron: koppen, tabellen met
 * thead/th, lijsten en links zijn daar al semantisch correct. Deze module vertaalt
 * die semantiek één op één naar OOXML, zodat de Word-export en de PDF die eruit
 * volgt dezelfde structuur hebben als de webversie.
 */

// Shift2-huisstijl
const PURPLE = '2A0A4A';
const ACCENT = '8A2BE2';
const BORDER_GRAY = '6D5A99';
const HEADER_BG = 'F6F3FB';
const MUTED = '4A4458';

const CONTENT_WIDTH = 9360;

const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY };
const cellBorders = { top: border, bottom: border, left: border, right: border };

const HEADING_BY_LEVEL: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

/** Inline-opmaak die tijdens het aflopen van de boom wordt meegedragen. */
interface InlineStyle {
  bold?: boolean;
  italics?: boolean;
  href?: string;
}

function isElement(node: AnyNode): node is Element {
  return node.type === 'tag';
}

/**
 * Loop de kinderen van een element af en bouw de losse tekstfragmenten op,
 * met behoud van vet, cursief en links.
 */
function inlineRuns(
  $: cheerio.CheerioAPI,
  node: AnyNode,
  style: InlineStyle = {},
): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];

  for (const child of ($(node).contents().toArray() as AnyNode[])) {
    if (child.type === 'text') {
      // Witruimte uit de HTML-opmaak samenvouwen, net als een browser doet.
      const text = (child.data ?? '').replace(/\s+/g, ' ');
      if (!text.trim()) {
        // Spatie tussen twee woorden mag niet wegvallen ("<b>Website:</b> foo").
        if (text === ' ' && runs.length > 0) {
          runs.push(new TextRun({ text: ' ', ...runStyle(style) }));
        }
        continue;
      }
      runs.push(new TextRun({ text, ...runStyle(style) }));
      continue;
    }

    if (!isElement(child)) continue;

    const tag = child.tagName.toLowerCase();

    if (tag === 'br') {
      runs.push(new TextRun({ text: '', break: 1 }));
      continue;
    }

    if (tag === 'a') {
      const href = $(child).attr('href');
      const inner = inlineRuns($, child, { ...style, href: undefined });
      if (href && /^https?:/i.test(href)) {
        runs.push(
          new ExternalHyperlink({
            link: href,
            children: inner.filter((r): r is TextRun => r instanceof TextRun).map(
              (r) => r,
            ),
          }),
        );
      } else {
        runs.push(...inner);
      }
      continue;
    }

    const nextStyle: InlineStyle = { ...style };
    if (tag === 'b' || tag === 'strong') nextStyle.bold = true;
    if (tag === 'i' || tag === 'em') nextStyle.italics = true;

    runs.push(...inlineRuns($, child, nextStyle));
  }

  return runs;
}

function runStyle(style: InlineStyle) {
  return {
    bold: style.bold || undefined,
    italics: style.italics || undefined,
  };
}

/** Losse tekst van een element, met samengevouwen witruimte. */
function textOf($: cheerio.CheerioAPI, node: AnyNode): string {
  return $(node).text().replace(/\s+/g, ' ').trim();
}

/**
 * Bouw de rijen van een tabel op. `thead`-rijen en `th`-cellen bepalen wat
 * als kop wordt gemarkeerd; `scope="row"` maakt de eerste cel een rijkop.
 */
function buildTable($: cheerio.CheerioAPI, tableEl: Element): Table {
  const rows: TableRow[] = [];
  const columnCount = Math.max(
    ...$(tableEl)
      .find('tr')
      .toArray()
      .map((tr) => $(tr).find('th,td').length),
    1,
  );

  const collect = (selector: string, isHeaderRow: boolean) => {
    $(tableEl)
      .find(selector)
      .toArray()
      .forEach((tr) => {
        const cells = $(tr).find('th,td').toArray() as Element[];
        if (cells.length === 0) return;

        const tableCells = cells.map((cell) => {
          const isHeaderCell = cell.tagName.toLowerCase() === 'th';
          const runs = inlineRuns($, cell);
          return new TableCell({
            borders: cellBorders,
            shading: isHeaderRow
              ? { type: ShadingType.CLEAR, fill: HEADER_BG, color: 'auto' }
              : undefined,
            children: [
              new Paragraph({
                children: runs.length ? runs : [new TextRun({ text: '' })],
                spacing: { before: 40, after: 40 },
                // Kop-cellen visueel vet; de semantiek zit in tableHeader/tblLook.
                run: isHeaderRow || isHeaderCell ? { bold: true, color: PURPLE } : undefined,
              }),
            ],
          });
        });

        rows.push(
          new TableRow({
            children: tableCells,
            // Alleen echte koprijen herhalen bij een paginabreuk.
            tableHeader: isHeaderRow,
            cantSplit: true,
          }),
        );
      });
  };

  collect('thead > tr', true);
  collect('tbody > tr', false);
  // Tabellen zonder thead/tbody: rijen die direct onder table hangen.
  if (rows.length === 0) collect('tr', false);

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: Array(columnCount).fill(Math.floor(CONTENT_WIDTH / columnCount)),
    rows,
  });
}

/** Eén lijst-element omzetten naar losse alinea's met opsommingstekens. */
function buildList(
  $: cheerio.CheerioAPI,
  listEl: Element,
  ordered: boolean,
  depth = 0,
): Paragraph[] {
  const out: Paragraph[] = [];

  $(listEl)
    .children('li')
    .toArray()
    .forEach((li, index) => {
      // Geneste lijsten apart afhandelen, zodat ze niet in de tekst belanden.
      const nested = $(li).children('ul,ol').toArray() as Element[];
      const $clone = $(li).clone();
      $clone.children('ul,ol').remove();

      const runs = inlineRuns($, $clone[0] as AnyNode);
      if (runs.length) {
        out.push(
          new Paragraph({
            children: runs,
            spacing: { after: 80 },
            ...(ordered
              ? { numbering: { reference: 'report-numbering', level: depth } }
              : { bullet: { level: depth } }),
          }),
        );
      }

      nested.forEach((child) => {
        out.push(
          ...buildList($, child, child.tagName.toLowerCase() === 'ol', depth + 1),
        );
      });
    });

  return out;
}

/** Het logo bovenaan; alleen opgenomen als het bestand gevonden wordt. */
function buildLogo($: cheerio.CheerioAPI, img: Element | undefined): Paragraph[] {
  if (!img) return [];
  const src = $(img).attr('src') ?? '';
  const alt = $(img).attr('alt') ?? '';
  const file = path.join(process.cwd(), 'public', src.replace(/^\//, ''));

  if (!fs.existsSync(file)) return [];

  return [
    new Paragraph({
      children: [
        new ImageRun({
          type: 'png',
          data: fs.readFileSync(file),
          transformation: { width: 182, height: 55 },
          // Tekstalternatief voor hulpsoftware.
          // Alleen description vullen: Word plakt description en title achter
          // elkaar in het tekstalternatief van de PDF, wat een dubbele tekst geeft.
          altText: { name: alt, description: alt },
        }),
      ],
      spacing: { after: 240 },
    }),
  ];
}

/**
 * Vul aan wat de docx-library zelf niet schrijft: de documenttaal en een
 * beschrijvende naam per tabel. Beide zijn nodig voor een toegankelijk
 * document en komen zo ook in de PDF-export terecht.
 */
async function applyAccessibilityMetadata(
  buffer: Buffer,
  lang: string,
  tableCaptions: string[],
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Documenttaal in de standaardopmaak; Word leidt hier de spellingtaal uit af.
  const stylesFile = zip.file('word/styles.xml');
  if (stylesFile) {
    let styles = await stylesFile.async('string');
    const langXml = `<w:lang w:val="${lang}" w:eastAsia="${lang}" w:bidi="ar-SA"/>`;
    if (/<w:lang[^>]*\/>/.test(styles)) {
      styles = styles.replace(/<w:lang[^>]*\/>/, langXml);
    } else {
      styles = styles.replace('</w:rPr></w:rPrDefault>', `${langXml}</w:rPr></w:rPrDefault>`);
    }
    zip.file('word/styles.xml', styles);
  }

  // 2. dc:language in de documenteigenschappen.
  const coreFile = zip.file('docProps/core.xml');
  if (coreFile) {
    let core = await coreFile.async('string');
    if (!core.includes('<dc:language>')) {
      core = core.replace(
        '</cp:coreProperties>',
        `<dc:language>${lang}</dc:language></cp:coreProperties>`,
      );
      zip.file('docProps/core.xml', core);
    }
  }

  // 3. Tabelnaam en kopregel-signalen. De docx-library schrijft w:tblLook en
  //    w:cnfStyle niet, terwijl Word daarin vastlegt dát een tabel een kopregel
  //    heeft. Zonder die twee laten veel PDF-converters THead/TH weg en wordt
  //    de hele tabel als TBody getagd.
  //    Schemavolgorde binnen w:tblPr: ... tblLook, tblCaption, tblDescription.
  const docFile = zip.file('word/document.xml');
  if (docFile) {
    let doc = await docFile.async('string');
    let index = 0;
    doc = doc.replace(/<\/w:tblPr>/g, (match) => {
      const caption = tableCaptions[index++];
      const look =
        '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0"' +
        ' w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>';
      const cap = caption ? `<w:tblCaption w:val="${escapeXmlAttr(caption)}"/>` : '';
      return `${look}${cap}${match}`;
    });

    // Cellen van een koprij markeren met cnfStyle. Alleen rijen met een kale
    // <w:tblHeader/> zijn koprijen; datarijen krijgen w:val="false" mee.
    doc = doc.replace(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g, (row) => {
      if (!/<w:trPr>[\s\S]*?<w:tblHeader\/>[\s\S]*?<\/w:trPr>/.test(row)) return row;
      return row.replace(/<w:tcPr>/g, '<w:tcPr><w:cnfStyle w:firstRow="1"/>');
    });
    zip.file('word/document.xml', doc);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Bepaal een beschrijvende naam voor een tabel: de dichtstbijzijnde kop erboven.
 */
function captionForTable($: cheerio.CheerioAPI, tableEl: Element): string {
  const explicit = $(tableEl).find('caption').first().text().trim();
  if (explicit) return explicit;

  // Klim omhoog door de boom en pak de eerste kop die vóór de tabel staat.
  // Tabellen zitten soms in een wrapper (<div class="panel">) waarbij de kop
  // in een broer-element een niveau hoger staat.
  let node = $(tableEl);
  for (let depth = 0; depth < 6; depth += 1) {
    const heading = node.prevAll('h1,h2,h3,h4,h5,h6').first().text().trim();
    if (heading) return heading;

    const inPrevious = node
      .prevAll()
      .find('h1,h2,h3,h4,h5,h6')
      .last()
      .text()
      .trim();
    if (inPrevious) return inPrevious;

    const parent = node.parent();
    if (!parent.length || parent.is('body,main')) break;
    node = parent;
  }

  return 'Tabel';
}

/**
 * Zet de rapport-HTML om naar een Word-document (.docx) als Buffer.
 */
export async function htmlReportToDocx(html: string): Promise<Buffer> {
  const $ = cheerio.load(html);

  const title =
    $('title').first().text().trim() || $('h1').first().text().trim() || 'Rapport';
  const lang = documentLanguage(html);
  const tableCaptions: string[] = [];

  const children: (Paragraph | Table)[] = [];

  children.push(...buildLogo($, $('header img').first()[0] as Element | undefined));

  // Alleen de inhoud van <main>; header/footer zijn navigatie, geen rapporttekst.
  const root = $('main').length ? $('main').first() : $('body').first();

  const walk = (node: AnyNode) => {
    if (!isElement(node)) return;
    const tag = node.tagName.toLowerCase();

    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const level = Number(tag[1]);
        const runs = inlineRuns($, node);
        if (!runs.length) return;
        children.push(
          new Paragraph({
            children: runs,
            heading: HEADING_BY_LEVEL[level],
            spacing: { before: level <= 2 ? 320 : 240, after: 120 },
            keepNext: true,
          }),
        );
        return;
      }

      case 'p': {
        const runs = inlineRuns($, node);
        if (!runs.length) return;
        const isIntro = ($(node).attr('class') ?? '').includes('intro');
        children.push(
          new Paragraph({
            children: runs,
            spacing: { after: 160 },
            ...(isIntro ? { run: { color: MUTED } } : {}),
          }),
        );
        return;
      }

      case 'ul':
      case 'ol':
        children.push(...buildList($, node, tag === 'ol'));
        return;

      case 'table':
        tableCaptions.push(captionForTable($, node));
        children.push(buildTable($, node));
        // Witregel na een tabel, anders plakt de volgende alinea eraan vast.
        children.push(new Paragraph({ text: '', spacing: { after: 160 } }));
        return;

      case 'img':
        children.push(...buildLogo($, node));
        return;

      case 'br':
      case 'script':
      case 'style':
        return;

      default:
        // Containers (section, div, article, figure, …) doorlopen.
        $(node)
          .contents()
          .toArray()
          .forEach((child) => walk(child as AnyNode));
    }
  };

  root
    .contents()
    .toArray()
    .forEach((child) => walk(child as AnyNode));

  const doc = new Document({
    title,
    description: title,
    creator: 'Shift2 Auditor',
    numbering: {
      config: [
        {
          reference: 'report-numbering',
          levels: [0, 1, 2].map((level) => ({
            level,
            format: 'decimal' as const,
            text: `%${level + 1}.`,
            alignment: AlignmentType.START,
            style: {
              paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } },
            },
          })),
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '1A1A1A' },
          paragraph: { spacing: { line: 276 } },
        },
        heading1: {
          run: { font: 'Calibri', size: 40, bold: true, color: PURPLE },
        },
        heading2: {
          run: { font: 'Calibri', size: 30, bold: true, color: PURPLE },
        },
        heading3: {
          run: { font: 'Calibri', size: 26, bold: true, color: PURPLE },
        },
        heading4: {
          run: { font: 'Calibri', size: 23, bold: true, color: ACCENT },
        },
        heading5: {
          run: { font: 'Calibri', size: 22, bold: true, color: MUTED },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return applyAccessibilityMetadata(Buffer.from(buffer), lang, tableCaptions);
}

/** Taalcode voor de documenteigenschappen; Word leidt hier de spellingtaal uit af. */
export function documentLanguage(html: string): string {
  const $ = cheerio.load(html);
  const lang = $('html').attr('lang') || 'nl';
  return lang.includes('-') ? lang : `${lang}-NL`;
}
