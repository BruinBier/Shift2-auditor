import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { prisma } from '@/lib/prisma';
import { marked } from 'marked';

const PURPLE = '6B2D8F';
const GRAY = '6B7280';
const GREEN = '0F7A2D';
const ORANGE = 'B45309';
const RED = 'B3261E';

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

function renderText(input: string | null | undefined): string {
  if (!input) return '';
  // Only escape < and > so embedded HTML-like text doesn't get parsed as tags.
  // Keep & untouched so existing entities stay readable when we strip.
  const safe = String(input).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  try {
    const html = marked.parse(safe, {
      breaks: true,
      gfm: true,
      async: false,
    } as any) as string;
    return stripHtml(html);
  } catch {
    return stripHtml(safe);
  }
}

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface FindingForExport {
  findingCode: string;
  description: string;
  status: string;
  impact: string | null;
  interimReviewed: boolean;
  interimNotes: string | null;
  discoveredInPhase: 'nulmeting' | 'tussencheck' | 'herinspectie';
  criterionCode: string;
  criterionTitle: string;
}

interface GroupedFindings {
  opgelost: FindingForExport[];
  nogOpen: FindingForExport[];
  nieuwGevonden: FindingForExport[];
  nietBeoordeeld: FindingForExport[];
  opmerkingen: FindingForExport[];
}

function groupFindings(findings: FindingForExport[]): GroupedFindings {
  const groups: GroupedFindings = {
    opgelost: [],
    nogOpen: [],
    nieuwGevonden: [],
    nietBeoordeeld: [],
    opmerkingen: [],
  };

  for (const f of findings) {
    const isOpmerking = f.impact == null;

    // Opmerking → always its own group, regardless of reviewed state
    if (isOpmerking) {
      groups.opmerkingen.push(f);
      continue;
    }

    // Real findings
    if (!f.interimReviewed) {
      groups.nietBeoordeeld.push(f);
      continue;
    }

    if (f.discoveredInPhase !== 'nulmeting') {
      groups.nieuwGevonden.push(f);
      continue;
    }

    if (f.status === 'resolved') {
      groups.opgelost.push(f);
    } else {
      groups.nogOpen.push(f);
    }
  }

  // Sort each group by findingCode (alphanumeric, locale)
  for (const key of Object.keys(groups) as (keyof GroupedFindings)[]) {
    groups[key].sort((a, b) =>
      a.findingCode.localeCompare(b.findingCode, 'nl', { numeric: true })
    );
  }

  return groups;
}

function findingLine(f: FindingForExport): Paragraph {
  const desc = truncate(renderText(f.description), 200);
  const children: TextRun[] = [
    new TextRun({ text: `${f.findingCode}  `, bold: true, color: PURPLE }),
    new TextRun({ text: `(${f.criterionCode}) `, color: GRAY }),
    new TextRun({ text: desc }),
  ];
  if (f.interimNotes && f.interimNotes.trim()) {
    children.push(
      new TextRun({ break: 1 }),
      new TextRun({
        text: `Notitie: ${truncate(f.interimNotes, 200)}`,
        italics: true,
        color: GRAY,
      })
    );
  }
  return new Paragraph({
    children,
    bullet: { level: 0 },
    spacing: { after: 120 },
  });
}

function sectionHeading(title: string, count: number, color: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({
        text: `${title} (${count})`,
        color,
        bold: true,
        size: 28,
      }),
    ],
  });
}

function sectionBlock(
  title: string,
  items: FindingForExport[],
  color: string,
  emptyText: string,
): Paragraph[] {
  const paragraphs: Paragraph[] = [sectionHeading(title, items.length, color)];
  if (items.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: emptyText, italics: true, color: GRAY })],
        spacing: { after: 120 },
      })
    );
  } else {
    for (const f of items) paragraphs.push(findingLine(f));
  }
  return paragraphs;
}

/**
 * Generate a voortgangsoverzicht (interim progress overview) DOCX as a Node Buffer.
 *
 * Throws if the project does not exist or is not in tussencheck/herinspectie phase.
 */
export async function generateVoortgangsoverzichtDocx(projectId: string): Promise<Buffer> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      findings: {
        include: {
          wcagCriterion: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.checkPhase !== 'tussencheck' && project.checkPhase !== 'herinspectie') {
    throw new Error(
      `Voortgangsoverzicht alleen beschikbaar in fase tussencheck of herinspectie (huidige fase: ${project.checkPhase}).`
    );
  }

  const exportFindings: FindingForExport[] = project.findings.map((f) => ({
    findingCode: f.findingCode,
    description: f.description,
    status: f.status,
    impact: f.impact,
    interimReviewed: f.interimReviewed,
    interimNotes: f.interimNotes,
    discoveredInPhase: f.discoveredInPhase,
    criterionCode: f.wcagCriterion.code,
    criterionTitle: f.wcagCriterion.titleNl,
  }));

  const groups = groupFindings(exportFindings);
  const phaseLabel = project.checkPhase === 'tussencheck' ? 'tussencheck' : 'herinspectie';

  const documentParagraphs: Paragraph[] = [];

  // Title
  documentParagraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'Voortgangsoverzicht',
          color: PURPLE,
          bold: true,
          size: 40,
        }),
      ],
    })
  );

  documentParagraphs.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: project.title, size: 26, color: PURPLE }),
      ],
    })
  );

  // Metadata
  const metaLines: string[] = [
    `Datum: ${fmtDate(new Date())}`,
    `Fase: ${phaseLabel}`,
  ];
  if (project.interimCheckLabel) {
    metaLines.push(`Label: ${project.interimCheckLabel}`);
  }
  if (project.kenmerk) {
    metaLines.push(`Kenmerk: ${project.kenmerk}`);
  }
  for (const line of metaLines) {
    documentParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, color: GRAY, size: 20 })],
        spacing: { after: 40 },
      })
    );
  }

  // Voortgang-samenvatting (één regel)
  const totalReal =
    groups.opgelost.length +
    groups.nogOpen.length +
    groups.nieuwGevonden.length +
    groups.nietBeoordeeld.length;
  const reviewed =
    groups.opgelost.length + groups.nogOpen.length + groups.nieuwGevonden.length;
  documentParagraphs.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: `Nagelopen: ${reviewed} van ${totalReal} echte bevindingen · `,
          color: GRAY,
          size: 22,
        }),
        new TextRun({
          text: `${groups.opgelost.length} opgelost`,
          color: GREEN,
          bold: true,
          size: 22,
        }),
        new TextRun({ text: ' · ', color: GRAY, size: 22 }),
        new TextRun({
          text: `${groups.nogOpen.length} nog open`,
          color: RED,
          bold: true,
          size: 22,
        }),
        new TextRun({ text: ' · ', color: GRAY, size: 22 }),
        new TextRun({
          text: `${groups.nieuwGevonden.length} nieuw gevonden`,
          color: ORANGE,
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  // Groepen
  documentParagraphs.push(
    ...sectionBlock(
      'Opgelost',
      groups.opgelost,
      GREEN,
      'Nog geen bevindingen op opgelost gezet.'
    )
  );
  documentParagraphs.push(
    ...sectionBlock(
      'Nog open',
      groups.nogOpen,
      RED,
      'Geen openstaande bevindingen.'
    )
  );
  documentParagraphs.push(
    ...sectionBlock(
      `Nieuw gevonden tijdens ${phaseLabel}`,
      groups.nieuwGevonden,
      ORANGE,
      'Geen nieuwe bevindingen ontdekt.'
    )
  );
  documentParagraphs.push(
    ...sectionBlock(
      'Nog niet beoordeeld',
      groups.nietBeoordeeld,
      GRAY,
      'Alle bevindingen zijn nagelopen.'
    )
  );
  documentParagraphs.push(
    ...sectionBlock(
      'Opmerkingen',
      groups.opmerkingen,
      GRAY,
      'Geen opmerkingen in dit project.'
    )
  );

  const doc = new Document({
    creator: 'Shift2 Auditor',
    title: `Voortgangsoverzicht ${project.title}`,
    description: 'Voortgangsoverzicht bevindingen',
    sections: [
      {
        properties: {},
        children: documentParagraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
