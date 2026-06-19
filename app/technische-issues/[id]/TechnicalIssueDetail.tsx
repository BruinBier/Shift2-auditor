'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TechnicalIssueForm, { TechnicalIssueFormValues } from '../TechnicalIssueForm';

interface Criterion {
  id: string;
  code: string;
  titleNl: string;
  level: string;
}

interface Comment {
  id: number;
  author: string;
  avatarUrl: string;
  htmlUrl: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initial: TechnicalIssueFormValues;
  criteria: Criterion[];
  wcagCriterion: Criterion | null;
  comments: Comment[];
  commentsError: string | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function buildGithubMarkdown(values: TechnicalIssueFormValues, criterion: Criterion | null): string {
  const lines: string[] = [];
  if (values.supplier) lines.push(`**Leverancier:** ${values.supplier}`);
  if (criterion) lines.push(`**WCAG:** ${criterion.code} ${criterion.titleNl} (Niveau ${criterion.level})`);
  if (values.impact) lines.push(`**Impact:** ${values.impact}`);
  if (lines.length > 0) lines.push('');

  lines.push('## Probleem');
  lines.push(values.description.trim());

  if (values.request && values.request.trim()) {
    lines.push('');
    lines.push('## Verzoek');
    lines.push(values.request.trim());
  }

  return lines.join('\n');
}

export default function TechnicalIssueDetail({ initial, criteria, wcagCriterion, comments, commentsError }: Props) {
  const router = useRouter();
  const [showGithub, setShowGithub] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const markdown = buildGithubMarkdown(initial, wcagCriterion);
  const alreadyPosted = Boolean(initial.githubIssueUrl);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const postToGithub = async () => {
    if (!confirm('Issue nu op GitHub plaatsen? Dit is niet terug te draaien vanuit Shift2-auditor.')) {
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(`/api/technical-issues/${initial.id}/post-to-github`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Posten mislukt (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Posten mislukt');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {alreadyPosted && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-gray-600 mr-2">GitHub-issue:</span>
          <a
            href={initial.githubIssueUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-shift2-primary hover:underline break-all"
          >
            {initial.githubIssueUrl} ↗
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowGithub((v) => !v)}
          className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
        >
          {showGithub ? 'Verberg GitHub-tekst' : 'Genereer GitHub-tekst'}
        </button>
        {alreadyPosted ? (
          <a
            href={initial.githubIssueUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:opacity-90"
          >
            Bekijk op GitHub ↗
          </a>
        ) : (
          <button
            type="button"
            onClick={postToGithub}
            disabled={posting}
            className="text-sm bg-shift2-primary text-white px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
          >
            {posting ? 'Bezig met posten...' : 'Plaats op GitHub'}
          </button>
        )}
      </div>

      {postError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {postError}
        </div>
      )}

      {showGithub && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">
              GitHub-issue tekst (titel + body)
            </div>
            <button
              type="button"
              onClick={copyMarkdown}
              className="text-sm bg-shift2-primary text-white px-3 py-1 rounded hover:opacity-90"
            >
              {copied ? 'Gekopieerd!' : 'Kopieer'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Titel: <code className="bg-gray-100 px-1 py-0.5 rounded">{initial.title}</code>
          </div>
          <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap">
            {markdown}
          </pre>
        </div>
      )}

      <TechnicalIssueForm mode="edit" initial={initial} criteria={criteria} />

      {alreadyPosted && (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Reacties op GitHub{' '}
              <span className="text-sm font-normal text-gray-500">({comments.length})</span>
            </h2>
            <a
              href={`${initial.githubIssueUrl}#new_comment_field`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-shift2-primary hover:underline"
            >
              Reageer op GitHub ↗
            </a>
          </div>

          {commentsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">
              {commentsError}
            </div>
          )}

          {!commentsError && comments.length === 0 && (
            <p className="text-sm text-gray-500">Nog geen reacties.</p>
          )}

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                {c.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-medium text-gray-900">{c.author}</span>
                    <a
                      href={c.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-shift2-primary hover:underline text-xs"
                    >
                      {formatDate(c.createdAt)}
                    </a>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {c.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
