import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  ExternalHyperlink,
  Bookmark,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
} from 'docx';
import { prisma } from '@/lib/prisma';
import { marked } from 'marked';
import {
  groupFindingsByHierarchy,
  calculateReportStats,
  calculatePrincipleStats,
  getPrincipleLabel,
  AssessmentStatus,
  type ProjectWithRelations,
} from '@/lib/report-calculations';

// Colors
const PURPLE = '2A0A4A';
const ACCENT = '8A2BE2';
const BORDER_GRAY = '6D5A99';
const FAIL_RED = 'B3261E';
const NOTE_GREEN = '077D11';
const HEADER_BG = 'F6F3FB';

const contentWidth = 9360;
const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY };
const cellBorders = {
  top: border,
  bottom: border,
  left: border,
  right: border,
};

// Markdown rendering stripping to plain text for docx
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function renderFindingToText(input: string | null | undefined): string {
  if (!input) return '';
  // Same as HTML generator: escape all HTML tags first, then parse markdown,
  // then strip to plain text for Word.
  const escaped = String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  try {
    const html = marked.parse(escaped, {
      breaks: true,
      gfm: true,
      async: false,
    } as any) as string;
    return stripHtml(html);
  } catch {
    return String(input);
  }
}

function formatDateNl(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function compareWcagCodes(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10));
  const pb = b.split('.').map((n) => parseInt(n, 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function buildReportTitle(project: any, website: string): string {
  // Researchtype bevat vaak al "WCAG 2.2 AA" (bijv. "WCAG 2.2 AA deelonderzoek content").
  // Voorkom dubbele "WCAG 2.2 AA" in de titel.
  const rt = String(project.researchType || 'Deelonderzoek').trim();
  const rtLower = rt.toLowerCase();
  const hasStandard =
    rtLower.includes(String(project.standard || '').toLowerCase()) ||
    rtLower.includes('wcag');
  const hasLevel =
    rtLower.includes(`niveau ${String(project.level || '').toLowerCase()}`) ||
    rtLower.includes(` ${String(project.level || '').toLowerCase()} `) ||
    rtLower.includes(` ${String(project.level || '').toLowerCase()}`);

  if (hasStandard && hasLevel) {
    return `${rt} website ${website}`.trim();
  }
  if (hasStandard) {
    return `${rt} niveau ${project.level || 'AA'} website ${website}`.trim();
  }
  return `${project.standard || 'WCAG 2.2'} ${project.level || 'AA'} ${rt} website ${website}`.trim();
}

function statusLabel(status: AssessmentStatus | string): string {
  switch (status) {
    case 'passed':
      return 'Voldoet';
    case 'failed':
      return 'Voldoet niet';
    case 'not_present':
      return 'niet aanwezig';
    case 'not_tested':
      return 'niet getoetst';
    default:
      return 'onbekend';
  }
}

// --- docx helpers ---

function p(text: string, opts: any = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 120 },
  });
}

function pRuns(runs: any[], opts: any = {}) {
  return new Paragraph({ children: runs, spacing: { after: 120 }, ...opts });
}

function heading(level: any, text: string, bookmarkId: string | null = null) {
  const runChildren = [new TextRun({ text })];
  const children = bookmarkId
    ? [new Bookmark({ id: bookmarkId, children: runChildren })]
    : runChildren;
  return new Paragraph({
    heading: level,
    children,
    spacing: { before: 240, after: 160 },
  });
}

function link(text: string, url: string) {
  return new ExternalHyperlink({
    children: [new TextRun({ text, style: 'Hyperlink' })],
    link: url,
  });
}

function bullet(text: string) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 200 },
    children: [new TextRun({ text })],
  });
}

function bulletRuns(runs: any[]) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 200 },
    children: runs,
  });
}

function plainListItem(label: string, value: string) {
  return new Paragraph({
    numbering: { reference: 'plain-list', level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

function headerCell(text: string, width: number) {
  const thickTop = { style: BorderStyle.SINGLE, size: 12, color: BORDER_GRAY };
  return new TableCell({
    borders: { top: thickTop, bottom: border, left: border, right: border },
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: PURPLE })],
      }),
    ],
  });
}

function dataCell(text: string, width: number, opts: any = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, ...opts })],
      }),
    ],
  });
}

function resultBadge(text: string, fail: boolean) {
  return pRuns([
    new TextRun({ text: 'Resultaat: ', bold: true }),
    new TextRun({ text, bold: true, color: fail ? FAIL_RED : NOTE_GREEN }),
  ]);
}

function adviceHeading(text = 'Advies') {
  return new Paragraph({
    heading: HeadingLevel.HEADING_5,
    children: [new TextRun({ text, italics: true })],
    spacing: { before: 120, after: 80 },
  });
}

// Split plain text into Paragraphs
function textToParagraphs(txt: string): Paragraph[] {
  if (!txt) return [];
  return txt
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map(
      (chunk) =>
        new Paragraph({
          children: [new TextRun({ text: chunk })],
          spacing: { after: 120 },
        })
    );
}

// -----------------------------------
// Main generator
// -----------------------------------

export async function generateReportDocx(projectId: string): Promise<Buffer> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      clientProject: true,
      scopeUrls: true,
      sampleItems: { orderBy: { orderIndex: 'asc' } },
      criterionAssessments: { include: { wcagCriterion: true } },
      findings: {
        include: {
          wcagCriterion: true,
          occurrences: { include: { sampleItem: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) throw new Error('Project not found');

  // Filter by research type
  let filteredAssessments = project.criterionAssessments;
  let researchTypeData: any = null;
  if (project.researchType) {
    const rt = await prisma.researchType.findUnique({
      where: { name: project.researchType },
      include: { criteria: { select: { wcagCriterionId: true } } },
    });
    if (rt) {
      researchTypeData = rt;
      if (rt.criteria.length > 0) {
        const allowed = new Set(rt.criteria.map((c) => c.wcagCriterionId));
        filteredAssessments = project.criterionAssessments.filter((a) =>
          allowed.has(a.wcagCriterion.id)
        );
      }
    }
  }

  const projectForCalc = {
    ...project,
    criterionAssessments: filteredAssessments,
  } as unknown as ProjectWithRelations;

  const grouped = await groupFindingsByHierarchy(projectForCalc);
  const stats = calculateReportStats(projectForCalc);
  const principleStats = calculatePrincipleStats(projectForCalc);

  const firstScopeUrl = project.scopeUrls.find(
    (u) => u.inScope === true && !u.parentUrlId
  );
  const scopeDomain = firstScopeUrl ? new URL(firstScopeUrl.url).hostname : '';
  const opdrachtgever =
    project.commissionedBy || project.clientProject?.name || 'n.v.t.';
  const website = scopeDomain || project.subject || '';
  const version = Number(project.version).toFixed(1);
  const datum = formatDateNl(project.reportDate);
  const title = buildReportTitle(project, website);
  const intro = `Dit rapport beschrijft de resultaten van het ${
    project.researchType || 'onderzoek'
  } naar de toegankelijkheid van de content op de website ${website}, uitgevoerd in opdracht van ${opdrachtgever}.`;

  const isContentOnderzoek = (project.researchType || '')
    .toLowerCase()
    .includes('content');

  // Flatten criteria for overview + findings
  const flatCriteria: any[] = [];
  for (const group of grouped) {
    for (const gl of group.guidelines) {
      for (const crit of gl.criteria) {
        flatCriteria.push(crit);
      }
    }
  }
  flatCriteria.sort((a, b) => compareWcagCodes(a.code, b.code));

  const allCriteriaRows = flatCriteria.map((c) => ({
    code: c.code,
    title: c.title,
    level: c.level,
    status: c.assessment?.status || AssessmentStatus.not_tested,
  }));

  const sampleItems = project.sampleItems.filter((s) => s.url || s.title);
  const scopeIn = project.scopeUrls.filter(
    (s) => s.inScope === true && !s.parentUrlId
  );
  const scopeOut = project.scopeUrls.filter((s) => s.inScope === false);

  // -----------------------------------
  // Build children array
  // -----------------------------------
  const children: any[] = [];

  // Logo
  const logoPath = path.join(process.cwd(), 'public', 'shift2-logo.png');
  if (fs.existsSync(logoPath)) {
    const logoPng = fs.readFileSync(logoPath);
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: logoPng,
            transformation: { width: 180, height: 60 },
            altText: {
              title: '',
              description: 'Logo Shift2',
              name: 'shift2-logo',
            },
          } as any),
        ],
        spacing: { before: 1200, after: 1200 },
      })
    );
  }

  // H1 title
  children.push(heading(HeadingLevel.HEADING_1, title));

  // Intro
  children.push(p(intro));

  // Project info list
  children.push(
    new Paragraph({
      spacing: { before: 6000 },
      children: [new TextRun({ text: '' })],
    })
  );
  children.push(plainListItem('Opdrachtgever', opdrachtgever));
  children.push(plainListItem('Website', website));
  children.push(plainListItem('Rapportversie', version));
  children.push(plainListItem('Datum', datum));

  // === SAMENVATTING (pagebreak) ===
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: true,
      children: [
        new Bookmark({
          id: 'samenvatting',
          children: [new TextRun({ text: 'Samenvatting' })],
        }),
      ],
      spacing: { before: 240, after: 160 },
    })
  );
  children.push(...renderSamenvatting(project, stats, researchTypeData));

  // === OVER DIT ONDERZOEK ===
  children.push(
    heading(HeadingLevel.HEADING_2, 'Over dit onderzoek', 'over-dit-onderzoek')
  );
  children.push(
    p(
      `Voor de website is een ${
        project.researchType || 'onderzoek'
      } uitgevoerd naar de toegankelijkheid, om vast te stellen in hoeverre deze voldoet aan ${
        project.standard || 'WCAG 2.2'
      } niveau ${project.level || 'AA'} (EN 301 549).`
    )
  );
  children.push(
    p(
      'De geldigheid van dit onderzoeksrapport bedraagt drie jaar. Bij substantiële wijzigingen in de content adviseren wij een aanvullend of nieuw onderzoek uit te laten voeren.'
    )
  );

  if (isContentOnderzoek) {
    children.push(heading(HeadingLevel.HEADING_3, 'Afbakening van het onderzoek'));
    children.push(
      p(
        'Dit deelonderzoek heeft uitsluitend betrekking op de content van de website die door de organisatie via het beheersysteem kan worden ingevoerd of aangepast.'
      )
    );
    children.push(
      p(
        'Bij dit onderzoek zijn 30 van de 55 succescriteria van WCAG 2.2 niveau A en AA beoordeeld.'
      )
    );
    children.push(
      p(
        'De overige 25 succescriteria hebben betrekking op de technische basis van de website en worden beoordeeld in het afzonderlijk deelonderzoek techniek.'
      )
    );
    children.push(p('Beide deelonderzoeken vormen gezamenlijk de volledige beoordeling van de website.'));
    children.push(
      heading(HeadingLevel.HEADING_4, 'Succescriteria beoordeeld in het technisch deelonderzoek')
    );
    children.push(
      p(
        'Onderstaande succescriteria zijn in dit contentonderzoek niet beoordeeld en vallen onder het afzonderlijke deelonderzoek techniek:'
      )
    );
    children.push(techSCTable());
  }

  children.push(heading(HeadingLevel.HEADING_3, 'Reikwijdte en werkwijze'));
  children.push(
    p(
      'Het onderzoek is uitgevoerd op basis van een representatieve steekproef. Binnen deze steekproef zijn de aangetroffen toegankelijkheidsproblemen zo concreet mogelijk beschreven. Waar mogelijk is een aanbeveling opgenomen om de afwijking te verhelpen.'
    )
  );
  children.push(
    p(
      'Dit onderzoek biedt geen uitputtend overzicht van alle mogelijke toegankelijkheidsproblemen. De bevindingen vormen een momentopname van de situatie ten tijde van het onderzoek.'
    )
  );

  children.push(heading(HeadingLevel.HEADING_3, 'Wat is WCAG?'));
  children.push(
    pRuns([
      new TextRun({ text: 'WCAG (' }),
      new TextRun({
        text: 'Web Content Accessibility Guidelines',
        language: { value: 'en' } as any,
      }),
      new TextRun({
        text: ') zijn internationaal erkende richtlijnen voor digitale toegankelijkheid, opgebouwd rond vier principes: Waarneembaar, Bedienbaar, Begrijpelijk en Robuust. Binnen deze principes zijn meetbare succescriteria vastgesteld.',
      }),
    ])
  );
  children.push(
    pRuns([link('Meer informatie: WCAG 2.2 (Nederlandse vertaling)', 'https://www.w3.org/Translations/WCAG22-nl')])
  );

  // === OVERZICHT RESULTATEN ===
  children.push(
    heading(HeadingLevel.HEADING_2, 'Overzicht resultaten', 'overzicht-resultaten')
  );
  children.push(p('De resultaten zijn weergegeven in twee overzichten: per succescriterium en per WCAG-principe.'));
  children.push(heading(HeadingLevel.HEADING_3, 'Resultaten per succescriterium'));
  children.push(scResultsTable(allCriteriaRows));
  children.push(heading(HeadingLevel.HEADING_3, 'Onderzoeksscores'));
  children.push(
    p('De tabel hieronder laat per WCAG-principe en per WCAG-niveau zien hoeveel succescriteria zijn getoetst en hoeveel daarvan goedgekeurd zijn.')
  );
  children.push(scoresTable(principleStats));

  // === BEVINDINGEN ===
  children.push(heading(HeadingLevel.HEADING_2, 'Bevindingen', 'bevindingen'));
  children.push(
    p(
      'Hieronder worden de vastgestelde afwijkingen beschreven. Per bevinding is de locatie en een beschrijving van het probleem opgenomen gevolgd door de impact op de gebruiker en een advies om de afwijking te verhelpen.'
    )
  );
  children.push(...renderBevindingenOrOpmerkingen(flatCriteria, 'open'));

  // === OPMERKINGEN ===
  children.push(heading(HeadingLevel.HEADING_2, 'Opmerkingen', 'opmerkingen'));
  children.push(
    p(
      'De onderstaande opmerkingen leiden niet tot een afkeuring, maar bevatten suggesties die de toegankelijkheid of gebruiksvriendelijkheid verder kunnen verbeteren.'
    )
  );
  children.push(...renderBevindingenOrOpmerkingen(flatCriteria, 'resolved'));

  // === BORGING EN VERVOLG ===
  children.push(
    heading(HeadingLevel.HEADING_2, 'Borging en vervolg', 'borging-en-vervolg')
  );
  children.push(
    p(
      "Omdat het onderzoek is uitgevoerd op basis van een steekproef, kunnen vergelijkbare afwijkingen ook voorkomen in pagina's die niet zijn onderzocht. Het is daarom raadzaam om de volledige website te controleren op vergelijkbare patronen en deze structureel te monitoren."
    )
  );
  children.push(
    p(
      "Daarnaast kunnen wijzigingen in de content of het publicatieproces nieuwe toegankelijkheidsrisico's met zich meebrengen. Structurele aandacht voor toegankelijkheid en periodieke herbeoordeling blijven daarom noodzakelijk."
    )
  );

  // === ONDERZOEKSDETAILS ===
  children.push(
    heading(HeadingLevel.HEADING_2, 'Onderzoeksdetails', 'onderzoeksdetails')
  );
  children.push(
    p(
      'Dit hoofdstuk bevat de onderzoeksverantwoording: de scope en steekproef van het onderzoek, de gehanteerde methode en de hulpmiddelen waarmee is getest.'
    )
  );

  // Scope
  children.push(heading(HeadingLevel.HEADING_3, 'Scope'));
  children.push(
    p(
      'Bij de URL staat de reden waarom een gedeelte wel of niet is meegenomen. Dit is conform de regels voor het bepalen van de scope in de evaluatiemethode WCAG-EM.'
    )
  );
  for (const s of scopeIn) {
    children.push(
      pRuns([
        link(s.url, s.url),
        new TextRun({ text: s.note ? ` (${s.note})` : ' (URI-basis)' }),
      ])
    );
  }
  if (scopeOut.length > 0) {
    children.push(heading(HeadingLevel.HEADING_4, 'Buiten scope'));
    for (const s of scopeOut) {
      children.push(
        bulletRuns([
          link(s.url, s.url),
          new TextRun({ text: s.note ? ` (${s.note})` : '' }),
        ])
      );
    }
  }

  // Steekproef
  children.push(heading(HeadingLevel.HEADING_3, 'Steekproef'));
  children.push(
    pRuns([
      new TextRun({
        text: "Dit onderzoek is uitgevoerd op basis van een steekproef. De wijze waarop de steekproef is bepaald staat voorgeschreven in het evaluatiedocument WCAG-EM. Zie: ",
      }),
      link(
        'https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek',
        'https://www.digitoegankelijk.nl/toegankelijkheidsverklaring/onderzoek'
      ),
    ])
  );
  children.push(heading(HeadingLevel.HEADING_4, 'Volledige steekproef'));
  for (const s of sampleItems) {
    if (s.url) {
      children.push(bulletRuns([link(s.url, s.url)]));
    } else {
      children.push(bullet(s.title || 'Onbenoemd'));
    }
  }

  // Method
  children.push(heading(HeadingLevel.HEADING_3, 'Onderzoeksmethode en technieken'));
  children.push(
    pRuns([
      new TextRun({ text: 'Dit onderzoek is uitgevoerd conform de evaluatiemethode ' }),
      link('WCAG-EM', 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em'),
      new TextRun({ text: '. Deze methode is aanbevolen door ' }),
      link('DigiToegankelijk (Logius)', 'https://www.digitoegankelijk.nl'),
      new TextRun({
        text: '. Bij het uitvoeren van dit onderzoek is ervan uitgegaan dat alle technieken van het W3C ondersteund worden en dus gebruikt mogen worden.',
      }),
    ])
  );

  // Test environment
  children.push(heading(HeadingLevel.HEADING_3, 'Testomgeving'));
  if (project.userAgents) {
    for (const para of textToParagraphs(stripHtml(project.userAgents))) {
      children.push(para);
    }
  } else {
    children.push(p('Niet opgegeven.'));
  }

  // Technologieën
  children.push(heading(HeadingLevel.HEADING_3, 'Technologieën'));
  const techs = (project.technologies || []) as string[];
  if (techs.length === 0) {
    children.push(p('Niet opgegeven.'));
  } else {
    for (const t of techs) children.push(bullet(t));
  }

  // -----------------------------------
  // Build document
  // -----------------------------------
  const doc = new Document({
    creator: 'Frits Karskens',
    lastModifiedBy: 'Frits Karskens',
    title,
    description: title,
    styles: {
      default: {
        document: {
          run: {
            font: 'Nuelis Sans',
            size: 22,
            language: { value: 'nl-NL' } as any,
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 40, bold: true, font: 'Brockmann', color: PURPLE },
          paragraph: {
            spacing: { before: 280, after: 200 },
            outlineLevel: 0,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, font: 'Brockmann', color: PURPLE },
          paragraph: {
            spacing: { before: 260, after: 160 },
            outlineLevel: 1,
            border: {
              bottom: {
                color: ACCENT,
                space: 4,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, font: 'Brockmann', color: PURPLE },
          paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 2 },
        },
        {
          id: 'Heading4',
          name: 'Heading 4',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, font: 'Brockmann', color: PURPLE },
          paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 3 },
        },
        {
          id: 'Heading5',
          name: 'Heading 5',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 22, bold: true, italics: true, font: 'Brockmann' },
          paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 4 },
        },
      ],
      characterStyles: [
        {
          id: 'Hyperlink',
          name: 'Hyperlink',
          basedOn: 'DefaultParagraphFont',
          run: { color: ACCENT, underline: { type: 'single' } as any },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: 'plain-list',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 0, hanging: 0 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            // A4 (11906 x 16838 DXA = 210 x 297 mm)
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // Post-process: add cnfStyle firstRow / firstColumn for table accessibility
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file('word/document.xml')!.async('string');
  const patched = patchTablesForAccessibility(docXml);
  zip.file('word/document.xml', patched);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  return out as Buffer;
}

// --- subrenders ---

function renderSamenvatting(
  project: any,
  stats: any,
  researchTypeData: any
): Paragraph[] {
  const dateStartFormatted = project.dateStart
    ? formatDateNl(project.dateStart)
    : '[datum]';
  const dateEndFormatted = project.dateEnd
    ? formatDateNl(project.dateEnd)
    : '[datum]';

  const totalPages = project.sampleItems?.length || 0;
  const passedCriteria = stats.effectivePassed || 0;
  const totalCriteria = stats.totalAssessed || 0;
  const percentage =
    totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;
  const failedCriteria = stats.failed || 0;
  const isFormulieren = researchTypeData?.type === 'formulieren';
  const uniqueForms =
    isFormulieren && project.scopeUrls
      ? project.scopeUrls.filter((u: any) => u.inScope).length
      : totalPages;

  const paras: Paragraph[] = [];

  if (researchTypeData?.summaryTemplate) {
    const filled = String(researchTypeData.summaryTemplate)
      .replace(/\{dateStart\}/g, dateStartFormatted)
      .replace(/\{dateEnd\}/g, dateEndFormatted)
      .replace(/\{totalPages\}/g, String(totalPages))
      .replace(/\{uniqueForms\}/g, String(uniqueForms))
      .replace(/\{totalCriteria\}/g, String(totalCriteria))
      .replace(/\{passedCriteria\}/g, String(passedCriteria))
      .replace(/\{percentage\}/g, String(percentage))
      .replace(/\{failedCriteria\}/g, String(failedCriteria))
      .replace(
        /\{compliesFully\}/g,
        percentage === 100 ? 'volledig' : 'niet volledig'
      )
      .replace(
        /\{formsSingularPlural\}/g,
        uniqueForms === 1 ? 'formulier' : 'formulieren'
      )
      .replace(
        /\{pagesSingularPlural\}/g,
        totalPages === 1 ? 'processtap' : 'processtappen'
      )
      .replace(
        /\{criteriaFailedSingularPlural\}/g,
        failedCriteria === 1 ? 'succescriterium' : 'succescriteria'
      )
      .replace(/\{standard\}/g, researchTypeData?.version || 'WCAG 2.2')
      .replace(/\{level\}/g, researchTypeData?.level || 'A en AA');
    for (const para of textToParagraphs(stripHtml(filled))) {
      paras.push(para);
    }
  } else {
    const criteriaWord =
      failedCriteria === 1 ? 'succescriterium' : 'succescriteria';
    paras.push(
      p(
        `Dit onderzoek is door Shift2 uitgevoerd tussen ${dateStartFormatted} en ${dateEndFormatted}. Voor dit deelonderzoek is een representatieve steekproef samengesteld van ${totalPages} gepubliceerde webpagina's met verschillende contenttypen.`
      )
    );
    paras.push(
      p(
        `De onderzochte content voldoet ${
          percentage === 100 ? 'volledig' : 'niet volledig'
        } aan WCAG 2.2 niveau A en AA. In dit deelonderzoek zijn ${totalCriteria} succescriteria beoordeeld. Er wordt voldaan aan ${passedCriteria} van deze ${totalCriteria} succescriteria (${percentage}%). Bij ${failedCriteria} ${criteriaWord} zijn afwijkingen vastgesteld.`
      )
    );
  }

  if (project.researcherFeedback) {
    for (const para of textToParagraphs(stripHtml(project.researcherFeedback))) {
      paras.push(para);
    }
  }

  paras.push(
    p(
      isFormulieren
        ? 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het beheer- en publicatieproces van formulieren.'
        : 'Wij adviseren om content periodiek te controleren op terugkerende patronen van toegankelijkheidsproblemen en toegankelijkheid structureel te borgen in het publicatieproces.'
    )
  );

  return paras;
}

function techSCTable() {
  const widths = [1200, 3160, 1000, 4000];
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: [
          headerCell('SC', widths[0]),
          headerCell('Naam', widths[1]),
          headerCell('Niveau', widths[2]),
          headerCell('Reden van uitsluiting', widths[3]),
        ],
      }),
      new TableRow({
        children: [
          dataCell('3.3.1', widths[0], { bold: true }),
          dataCell('Foutidentificatie', widths[1]),
          dataCell('A', widths[2]),
          dataCell(
            'Formuliervalidatie wordt volledig door het systeem afgehandeld',
            widths[3]
          ),
        ],
      }),
      new TableRow({
        children: [
          dataCell('3.3.3', widths[0], { bold: true }),
          dataCell('Foutsuggestie', widths[1]),
          dataCell('AA', widths[2]),
          dataCell(
            'Foutsuggesties worden door het systeem gegenereerd',
            widths[3]
          ),
        ],
      }),
      new TableRow({
        children: [
          dataCell('3.3.7', widths[0], { bold: true }),
          dataCell('Overbodige invoer', widths[1]),
          dataCell('A', widths[2]),
          dataCell(
            'Het hergebruik van eerder ingevoerde gegevens binnen processen is binnen het platform technisch ingericht en wordt centraal beheerd.',
            widths[3]
          ),
        ],
      }),
    ],
  });
}

function scResultsTable(
  rows: Array<{ code: string; title: string; level: string; status: any }>
) {
  const widths = [5760, 1600, 2000];
  const tableRows = [
    new TableRow({
      children: [
        headerCell('Succescriterium', widths[0]),
        headerCell('Niveau', widths[1]),
        headerCell('Resultaat', widths[2]),
      ],
    }),
  ];
  for (const r of rows) {
    const isFail = r.status === 'failed';
    tableRows.push(
      new TableRow({
        children: [
          dataCell(`${r.code} ${r.title}`, widths[0], isFail ? { bold: true } : {}),
          dataCell(r.level, widths[1], isFail ? { bold: true } : {}),
          dataCell(
            statusLabel(r.status),
            widths[2],
            isFail ? { bold: true, color: FAIL_RED } : {}
          ),
        ],
      })
    );
  }
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: tableRows,
  });
}

function scoresTable(principleStats: any[]) {
  const widths = [3360, 2000, 2000, 2000];
  const rows = [
    new TableRow({
      children: [
        headerCell('WCAG Principe', widths[0]),
        headerCell('Niveau A', widths[1]),
        headerCell('Niveau AA', widths[2]),
        headerCell('Totaal', widths[3]),
      ],
    }),
  ];

  let totA = 0,
    totAA = 0,
    passA = 0,
    passAA = 0;

  for (const ps of principleStats) {
    const aP = ps.levelA?.passed || 0;
    const aT = ps.levelA?.total || 0;
    const aaP = ps.levelAA?.passed || 0;
    const aaT = ps.levelAA?.total || 0;
    const tP = ps.total?.passed || aP + aaP;
    const tT = ps.total?.total || aT + aaT;
    totA += aT;
    totAA += aaT;
    passA += aP;
    passAA += aaP;
    rows.push(
      new TableRow({
        children: [
          dataCell(getPrincipleLabel(ps.principle), widths[0]),
          dataCell(`${aP} / ${aT}`, widths[1]),
          dataCell(`${aaP} / ${aaT}`, widths[2]),
          dataCell(`${tP} / ${tT}`, widths[3]),
        ],
      })
    );
  }
  rows.push(
    new TableRow({
      children: [
        dataCell('Totaal', widths[0], { bold: true }),
        dataCell(`${passA} / ${totA}`, widths[1], { bold: true }),
        dataCell(`${passAA} / ${totAA}`, widths[2], { bold: true }),
        dataCell(`${passA + passAA} / ${totA + totAA}`, widths[3], {
          bold: true,
        }),
      ],
    })
  );
  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

function renderBevindingenOrOpmerkingen(
  flatCriteria: any[],
  filterStatus: 'open' | 'resolved'
): any[] {
  const isOpmerkingen = filterStatus === 'resolved';
  const badgeLabel = isOpmerkingen
    ? 'Voldoet maar met opmerking'
    : 'Voldoet niet';
  const itemLabel = isOpmerkingen ? 'Opmerking' : 'Bevinding';

  const out: any[] = [];

  for (const crit of flatCriteria) {
    const findings = (crit.findings || []).filter((f: any) => {
      if (isOpmerkingen) return f.status === 'resolved';
      return f.status === 'open' || f.status === 'published';
    });
    if (findings.length === 0) continue;

    out.push(heading(HeadingLevel.HEADING_3, `${crit.code} ${crit.title}  ${crit.level}`));
    if (crit.description) {
      out.push(p(stripHtml(crit.description)));
    }
    if (crit.understandingUrl) {
      out.push(pRuns([link(`${crit.code} ${crit.title}`, crit.understandingUrl)]));
    }
    out.push(resultBadge(badgeLabel, !isOpmerkingen));

    findings.forEach((f: any, idx: number) => {
      out.push(
        heading(
          HeadingLevel.HEADING_4,
          `${itemLabel} ${idx + 1} (SC ${crit.code})`
        )
      );
      const urls = Array.from(
        new Set(
          (f.occurrences || [])
            .map((o: any) => o.sampleItem?.url)
            .filter((u: any) => !!u)
        )
      ) as string[];
      if (urls.length === 1) {
        out.push(pRuns([link(urls[0], urls[0])]));
      } else if (urls.length > 1) {
        for (const u of urls) out.push(bulletRuns([link(u, u)]));
      }
      const descText = renderFindingToText(f.description);
      for (const para of textToParagraphs(descText)) out.push(para);

      if (f.advice) {
        out.push(adviceHeading());
        const adviceText = renderFindingToText(f.advice);
        for (const para of textToParagraphs(adviceText)) out.push(para);
      }
    });
  }

  if (out.length === 0) {
    out.push(p('Er zijn geen ' + (isOpmerkingen ? 'opmerkingen' : 'bevindingen') + ' vastgesteld.'));
  }

  return out;
}

// -----------------------------------
// XML post-processing for table accessibility (TH in header row + row headers)
// -----------------------------------
function patchTablesForAccessibility(xml: string): string {
  return xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (tblXml) => {
    const rowRe = /<w:tr\b[\s\S]*?<\/w:tr>/g;
    const segments: Array<{ type: 'row' | 'other'; xml: string }> = [];
    let m: RegExpExecArray | null;
    let nonRowStart = 0;
    while ((m = rowRe.exec(tblXml)) !== null) {
      if (m.index > nonRowStart)
        segments.push({
          type: 'other',
          xml: tblXml.slice(nonRowStart, m.index),
        });
      segments.push({ type: 'row', xml: m[0] });
      nonRowStart = m.index + m[0].length;
    }
    if (nonRowStart < tblXml.length)
      segments.push({ type: 'other', xml: tblXml.slice(nonRowStart) });

    let rowIndex = 0;
    const newSegments = segments.map((seg) => {
      if (seg.type !== 'row') return seg;
      const isFirstRow = rowIndex === 0;
      rowIndex++;
      let cellIndex = 0;
      const newRowXml = seg.xml.replace(
        /<w:tc\b[\s\S]*?<\/w:tc>/g,
        (tcXml) => {
          const isFirstCol = cellIndex === 0;
          cellIndex++;
          const attrs: string[] = [];
          if (isFirstRow) attrs.push('w:firstRow="1"');
          if (isFirstCol) attrs.push('w:firstColumn="1"');
          if (!attrs.length) return tcXml;
          const cnf = `<w:cnfStyle ${attrs.join(' ')}/>`;
          if (/<w:tcPr>/.test(tcXml)) {
            return tcXml.replace(/<w:tcPr>/, `<w:tcPr>${cnf}`);
          }
          return tcXml.replace(
            /<w:tc(\b[^>]*)>/,
            `<w:tc$1><w:tcPr>${cnf}</w:tcPr>`
          );
        }
      );
      return { type: 'row' as const, xml: newRowXml };
    });

    let newTbl = newSegments.map((s) => s.xml).join('');
    newTbl = newTbl.replace(
      /<w:tblPr>([\s\S]*?)<\/w:tblPr>/,
      (_full, inner) => {
        const cleaned = inner.replace(/<w:tblLook\b[^/]*\/>/g, '');
        const tblLook =
          '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>';
        return `<w:tblPr>${cleaned}${tblLook}</w:tblPr>`;
      }
    );
    return newTbl;
  });
}
