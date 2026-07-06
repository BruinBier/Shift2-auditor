import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGithubIssue } from '@/lib/github';
import { addIssueToProjectAndSetStatus } from '@/lib/github-project';

function buildBody(issue: {
  supplier: string | null;
  impact: string | null;
  description: string;
  request: string | null;
  wcagCriterion: { code: string; titleNl: string; level: string } | null;
}): string {
  const lines: string[] = [];
  if (issue.supplier) lines.push(`**Leverancier:** ${issue.supplier}`);
  if (issue.wcagCriterion) {
    lines.push(
      `**WCAG:** ${issue.wcagCriterion.code} ${issue.wcagCriterion.titleNl} (Niveau ${issue.wcagCriterion.level})`
    );
  }
  if (issue.impact) lines.push(`**Impact:** ${issue.impact}`);
  if (lines.length > 0) lines.push('');

  lines.push('## Probleem');
  lines.push(issue.description.trim());

  if (issue.request && issue.request.trim()) {
    lines.push('');
    lines.push('## Verzoek');
    lines.push(issue.request.trim());
  }

  return lines.join('\n');
}

function buildLabels(issue: {
  supplier: string | null;
  impact: string | null;
  wcagCriterion: { code: string } | null;
}): string[] {
  const labels: string[] = [];
  if (issue.supplier) {
    labels.push(`leverancier:${issue.supplier.toLowerCase().trim()}`);
  }
  if (issue.wcagCriterion) {
    labels.push(`wcag:${issue.wcagCriterion.code}`);
  }
  if (issue.impact) {
    labels.push(`impact:${issue.impact}`);
  }
  return labels;
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const issue = await prisma.technicalIssue.findUnique({
      where: { id: params.id },
      include: {
        wcagCriterion: { select: { code: true, titleNl: true, level: true } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue niet gevonden' }, { status: 404 });
    }

    if (issue.githubIssueUrl) {
      return NextResponse.json(
        { error: 'Dit issue is al gepost op GitHub', githubIssueUrl: issue.githubIssueUrl },
        { status: 409 }
      );
    }

    const body = buildBody(issue);
    const labels = buildLabels(issue);

    const result = await createGithubIssue({
      title: issue.title,
      body,
      labels,
    });

    const updated = await prisma.technicalIssue.update({
      where: { id: issue.id },
      data: { githubIssueUrl: result.url },
    });

    let projectWarning: string | null = null;
    try {
      await addIssueToProjectAndSetStatus(result.nodeId, 'Open');
    } catch (err) {
      projectWarning = err instanceof Error ? err.message : 'Project-assignment failed';
      console.error('Project assignment failed:', err);
    }

    return NextResponse.json({
      githubIssueUrl: updated.githubIssueUrl,
      number: result.number,
      projectWarning,
    });
  } catch (error) {
    console.error('Failed to post to GitHub:', error);
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
