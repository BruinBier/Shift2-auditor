import { prisma } from '@/lib/prisma';
import { listGithubIssues, GithubIssueSummary } from '@/lib/github';
import { addIssueToProjectAndSetStatus } from '@/lib/github-project';

const IMPACT_VALUES = ['klein', 'matig', 'serieus', 'kritiek', 'onbekend'] as const;
type ImpactValue = (typeof IMPACT_VALUES)[number];

interface ParsedBody {
  supplier: string | null;
  wcagCode: string | null;
  impact: ImpactValue | null;
  description: string;
  request: string | null;
}

function isPlaceholder(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.startsWith('<') && v.endsWith('>')) return true;
  return false;
}

function parseImpact(raw: string): ImpactValue | null {
  const lower = raw.toLowerCase().trim();
  for (const v of IMPACT_VALUES) {
    if (lower === v) return v;
  }
  return null;
}

function parseWcagCode(raw: string): string | null {
  const m = raw.match(/\b(\d+\.\d+\.\d+)\b/);
  return m ? m[1] : null;
}

function parseBody(body: string): ParsedBody {
  const supplierMatch = body.match(/\*\*Leverancier:\*\*\s*(.+?)(?:\r?\n|$)/i);
  const wcagMatch = body.match(/\*\*WCAG:\*\*\s*(.+?)(?:\r?\n|$)/i);
  const impactMatch = body.match(/\*\*Impact:\*\*\s*(.+?)(?:\r?\n|$)/i);

  const supplierRaw = supplierMatch?.[1]?.trim() || '';
  const wcagRaw = wcagMatch?.[1]?.trim() || '';
  const impactRaw = impactMatch?.[1]?.trim() || '';

  const supplier = supplierRaw && !isPlaceholder(supplierRaw) ? supplierRaw : null;
  const wcagCode = wcagRaw && !isPlaceholder(wcagRaw) ? parseWcagCode(wcagRaw) : null;
  const impact = impactRaw && !isPlaceholder(impactRaw) ? parseImpact(impactRaw) : null;

  let description = '';
  let request: string | null = null;

  const probleemIdx = body.search(/^##\s*Probleem\s*$/im);
  const verzoekIdx = body.search(/^##\s*Verzoek\s*$/im);

  if (probleemIdx >= 0) {
    const after = body.slice(probleemIdx).replace(/^##\s*Probleem\s*\r?\n/i, '');
    if (verzoekIdx > probleemIdx) {
      const probleemSlice = body.slice(probleemIdx, verzoekIdx).replace(/^##\s*Probleem\s*\r?\n/i, '');
      description = probleemSlice.trim();
      const verzoekSlice = body.slice(verzoekIdx).replace(/^##\s*Verzoek\s*\r?\n/i, '');
      const r = verzoekSlice.trim();
      request = r && !isPlaceholder(r) ? r : null;
    } else {
      description = after.trim();
    }
  } else {
    description = body.trim();
  }

  if (isPlaceholder(description)) {
    description = body.trim();
  }

  return { supplier, wcagCode, impact, description, request };
}

export interface SyncResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function syncGithubIssuesToShift2(): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, skipped: 0, errors: [] };

  let issues: GithubIssueSummary[];
  try {
    issues = await listGithubIssues();
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : 'GitHub list failed');
    return result;
  }

  if (issues.length === 0) return result;

  const existing = await prisma.technicalIssue.findMany({
    where: { githubIssueUrl: { in: issues.map((i) => i.url) } },
    select: { githubIssueUrl: true },
  });
  const existingUrls = new Set(existing.map((e) => e.githubIssueUrl));

  for (const issue of issues) {
    if (existingUrls.has(issue.url)) {
      result.skipped += 1;
      continue;
    }

    const parsed = parseBody(issue.body);

    let wcagCriterionId: string | null = null;
    if (parsed.wcagCode) {
      const criterion = await prisma.wCAGCriterion.findUnique({
        where: { code: parsed.wcagCode },
        select: { id: true },
      });
      wcagCriterionId = criterion?.id || null;
    }

    try {
      await prisma.technicalIssue.create({
        data: {
          title: issue.title,
          description: parsed.description || '(geen beschrijving)',
          request: parsed.request,
          wcagCriterionId,
          impact: parsed.impact,
          supplier: parsed.supplier,
          status: issue.state === 'closed' ? 'resolved' : 'open',
          githubIssueUrl: issue.url,
        },
      });
      result.imported += 1;

      if (issue.state !== 'closed') {
        try {
          await addIssueToProjectAndSetStatus(issue.nodeId, 'Ingediend');
        } catch (err) {
          result.errors.push(
            `Issue #${issue.number} project: ${err instanceof Error ? err.message : 'project failed'}`
          );
        }
      }
    } catch (err) {
      result.errors.push(
        `Issue #${issue.number}: ${err instanceof Error ? err.message : 'create failed'}`
      );
    }
  }

  return result;
}
