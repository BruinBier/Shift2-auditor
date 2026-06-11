'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TestCoverage } from '@/lib/wcag-coverage';

interface SampleResult {
  id: string;
  title: string;
  url: string | null;
  sampleType: string;
  orderIndex: number | null;
  crawledAt: Date | null;
  crawlerResults: Array<{
    id: string;
    testId: string;
    testName: string;
    found: boolean;
    count: number;
    details: string | null;
    createdAt: Date;
  }>;
}

interface Props {
  project: {
    id: string;
    kenmerk: string | null;
    title: string;
    sampleItems: SampleResult[];
  };
  testName: string;
  testInfo: TestCoverage | undefined;
  stats: {
    samplesTested: number;
    samplesWithIssues: number;
    totalVoorvallen: number;
    totalSamples: number;
  };
}

export default function TestDetailClient({ project, testName, testInfo, stats }: Props) {
  const [expandedSample, setExpandedSample] = useState<string | null>(null);

  const samplesSorted = [...project.sampleItems].sort((a, b) => {
    // Met issues bovenaan, daarna op orderIndex
    const aHas = a.crawlerResults.some((r) => r.found) ? 0 : 1;
    const bHas = b.crawlerResults.some((r) => r.found) ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    return (a.orderIndex ?? 999) - (b.orderIndex ?? 999);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1400px] mx-auto px-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href={`/admin/projects/${project.id}`} className="hover:underline">
            {project.kenmerk} {project.title}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/admin/projects/${project.id}?tab=richtlijnen`} className="hover:underline">
            Richtlijnen
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{testInfo?.titleNl || testName}</span>
        </div>

        {/* Hero block */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            {stats.samplesWithIssues > 0 ? (
              <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 text-lg">
                ⚠
              </span>
            ) : stats.samplesTested > 0 ? (
              <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-lg">
                ✓
              </span>
            ) : (
              <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 text-lg">
                ○
              </span>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{testInfo?.titleNl || testName}</h1>
              <p className="text-sm text-gray-500 font-mono mt-1">{testName}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatBox label="Voorvallen" value={stats.totalVoorvallen} color="red" />
            <StatBox
              label="Pagina's met issues"
              value={`${stats.samplesWithIssues} / ${stats.totalSamples}`}
              hint={
                stats.totalSamples > stats.samplesTested
                  ? `${stats.totalSamples - stats.samplesTested} nog niet getest`
                  : `${stats.samplesTested} getest`
              }
              color="orange"
            />
            <StatBox
              label="Verantwoordelijkheid"
              value={getResponsibility(testInfo)}
              color="gray"
              small
            />
            <StatBox label="Bron" value={testInfo?.source || '—'} color="blue" small />
          </div>

          {/* Description + Meer informatie + WCAG */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Beschrijving</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {testInfo?.descriptionNl || (
                  <span className="italic text-gray-500">
                    Nog geen beschrijving beschikbaar voor deze test.
                  </span>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Meer informatie</h3>
              {testInfo?.moreInfoNl ? (
                <div className="text-sm text-gray-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                  {testInfo.moreInfoNl}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nog niet aangevuld.</p>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">WCAG-criteria</h3>
                {testInfo && testInfo.scs.length > 0 ? (
                  <ul className="space-y-1">
                    {testInfo.scs.map((sc) => (
                      <li key={sc} className="text-sm">
                        <Link
                          href={`/admin/projects/${project.id}?tab=richtlijnen`}
                          className="text-purple-700 hover:underline font-mono"
                        >
                          SC {sc}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">Geen WCAG-koppeling.</p>
                )}
              </div>
              {testInfo?.note && (
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Opmerking</h3>
                  <p className="text-sm text-gray-700 italic">{testInfo.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Samples table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sample-items met dit probleem</h2>
            <span className="text-xs text-gray-500">
              {stats.samplesWithIssues} van {stats.totalSamples} samples
            </span>
          </div>
          {samplesSorted.length === 0 ? (
            <p className="px-6 py-8 text-gray-500 italic text-center">
              Nog geen sample-items in dit project.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-2 font-medium w-12">Status</th>
                  <th className="px-3 py-2 font-medium">Sample</th>
                  <th className="px-3 py-2 font-medium text-right w-32">Voorvallen</th>
                  <th className="px-3 py-2 font-medium text-right w-32">Getest op</th>
                  <th className="px-3 py-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {samplesSorted.map((sample) => {
                  const result = sample.crawlerResults[0]; // er is maar één resultaat per testName per sample
                  const isExpanded = expandedSample === sample.id;
                  const hasIssue = result?.found ?? false;
                  const tested = !!result;

                  return (
                    <>
                      <tr
                        key={sample.id}
                        className={`border-t border-gray-100 ${
                          hasIssue ? 'cursor-pointer hover:bg-red-50' : ''
                        }`}
                        onClick={() => hasIssue && setExpandedSample(isExpanded ? null : sample.id)}
                      >
                        <td className="px-6 py-3">
                          {!tested ? (
                            <span className="text-gray-400 text-lg" title="Nog niet getest">
                              ○
                            </span>
                          ) : hasIssue ? (
                            <span className="text-red-600 text-lg" title="Probleem gevonden">
                              ⚠
                            </span>
                          ) : (
                            <span className="text-green-600 text-lg" title="Geen probleem">
                              ✓
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{sample.title}</div>
                          {sample.url && (
                            <a
                              href={sample.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-700 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {sample.url}
                            </a>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {hasIssue ? (
                            <span className="text-red-700 font-semibold">{result.count}</span>
                          ) : tested ? (
                            <span className="text-gray-400">0</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-gray-500">
                          {sample.crawledAt
                            ? new Date(sample.crawledAt).toLocaleDateString('nl-NL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {hasIssue && (
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform inline-block ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </td>
                      </tr>
                      {isExpanded && hasIssue && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="px-6 py-4">
                            <DetailsView details={result.details} pageUrl={sample.url} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  small = false,
  hint,
}: {
  label: string;
  value: string | number;
  color: 'red' | 'orange' | 'blue' | 'gray';
  small?: boolean;
  hint?: string;
}) {
  const colorMap = {
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`p-4 rounded border ${colorMap[color]}`}>
      <div className="text-xs uppercase tracking-wide opacity-75 mb-1">{label}</div>
      <div className={small ? 'text-base font-semibold capitalize' : 'text-2xl font-semibold'}>{value}</div>
      {hint && <div className="text-xs opacity-75 mt-1">{hint}</div>}
    </div>
  );
}

function getResponsibility(t?: TestCoverage): string {
  if (!t) return '—';
  // Snelle heuristiek op basis van testnaam
  const n = t.testName.toLowerCase();
  if (n.includes('alt') || n.includes('label') || n.includes('heading') || n.includes('readmore'))
    return 'redacteur';
  if (n.includes('contrast') || n.includes('viewport')) return 'ontwerper';
  return 'ontwikkelaar';
}

/**
 * Kort lange strings en data-URIs in tot een leesbare samenvatting.
 * - data:image/...;base64,XXX (50 KB)  → "data:image/png; (inline, 50 KB)"
 * - andere strings > 250 tekens → afgekapt met '…'
 */
function shortenString(s: string): string {
  if (typeof s !== 'string') return s;
  // Pure data-URI (de hele string is de data)
  if (s.startsWith('data:')) {
    const sizeKb = Math.round(s.length / 1024);
    const mime = s.match(/^data:([^;,]+)/)?.[1] || 'inline data';
    return `data:${mime}; (inline, ${sizeKb} KB)`;
  }
  // Embedded data-URIs binnen een grotere string (bv. een HTML-snippet)
  // worden vervangen door een korte placeholder.
  let cleaned = s.replace(
    /data:([a-z0-9+./-]+)[;,][^"'\s>]+/gi,
    (match, mime) => {
      const sizeKb = Math.round(match.length / 1024);
      return `data:${mime};... (inline, ${sizeKb} KB)`;
    },
  );
  if (cleaned.length > 250) cleaned = cleaned.slice(0, 250) + '…';
  return cleaned;
}

/** Bouw een absolute URL voor een src die relatief, data-URI of protocol-relatief kan zijn. */
function resolveImageUrl(src: string, pageUrl?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith('data:')) return src; // inline base64 — direct als img-src bruikbaar
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (!pageUrl) return null;
  try {
    return new URL(src, pageUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Probeer een volledige data-URI uit een html-snippet te halen.
 * Nuttig wanneer item.src is afgekapt door de crawler maar het html-veld
 * nog de hele data-URI bevat.
 */
function extractDataUriFromHtml(html: string | undefined): string | null {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/data:([a-z0-9+./-]+);base64,([A-Za-z0-9+/=]+)/i);
  return match ? match[0] : null;
}

/** Compacte preview van een externe afbeelding-URL. */
function ImagePreview({ url }: { url: string }) {
  return (
    <div className="mt-2 mb-1">
      <a href={url} target="_blank" rel="noopener noreferrer" title="Open afbeelding in nieuw tabblad">
        <img
          src={url}
          alt=""
          className="max-h-32 max-w-xs border border-gray-200 rounded bg-gray-100"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </a>
    </div>
  );
}

/** Render een issue-object als nette key-value tabel in plaats van rauwe JSON. */
function RenderItem({ item, pageUrl }: { item: Record<string, any>; pageUrl?: string | null }) {
  const entries = Object.entries(item);
  // Detecteer eventuele src/img-velden voor preview
  const srcCandidate =
    typeof item.src === 'string' ? item.src :
    typeof item.imageUrl === 'string' ? item.imageUrl : null;
  // Als src is afgekapt (samengevat tot "data:image/png; (inline, X KB)"),
  // probeer dan een volledige data-URI uit het html-veld te halen.
  const srcLooksTruncated =
    typeof srcCandidate === 'string' &&
    srcCandidate.startsWith('data:') &&
    !/[A-Za-z0-9+/]{16,}/.test(srcCandidate);
  const fallbackDataUri = srcLooksTruncated
    ? extractDataUriFromHtml(item.html)
    : null;
  const previewSrc = fallbackDataUri || srcCandidate;
  const previewUrl = previewSrc ? resolveImageUrl(previewSrc, pageUrl) : null;

  return (
    <div>
      {previewUrl && <ImagePreview url={previewUrl} />}
      <table className="w-full text-xs">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="align-top">
              <td className="text-gray-500 font-medium pr-3 py-0.5 whitespace-nowrap w-32">{key}</td>
              <td className="py-0.5 break-all">
                {value === null || value === undefined ? (
                  <span className="text-gray-400 italic">leeg</span>
                ) : typeof value === 'string' ? (
                  <code className="text-gray-800">{shortenString(value)}</code>
                ) : typeof value === 'object' ? (
                  <pre className="overflow-x-auto whitespace-pre-wrap text-[10px]">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <code className="text-gray-800">{String(value)}</code>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailsView({ details, pageUrl }: { details: string | null; pageUrl?: string | null }) {
  const [showAll, setShowAll] = useState(false);

  if (!details) {
    return <p className="text-sm text-gray-500 italic">Geen details opgeslagen.</p>;
  }
  let parsed: any;
  try {
    parsed = JSON.parse(details);
  } catch {
    return <p className="text-sm text-gray-500 italic">Details konden niet worden geparsed.</p>;
  }

  // Probeer common shape: { issues: [...] } of { headings: [...] } etc.
  const arrays = Object.entries(parsed).filter(([_, v]) => Array.isArray(v) && (v as any[]).length > 0);
  const firstArray = arrays[0];

  if (!firstArray) {
    return (
      <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  }

  const [, items] = firstArray as [string, any[]];
  // Standaard alles tonen tot 20; daarboven inklappen tot 20 met toggle.
  const SOFT_LIMIT = 20;
  const visibleItems = items.length > SOFT_LIMIT && !showAll ? items.slice(0, SOFT_LIMIT) : items;
  const moreCount = items.length - visibleItems.length;

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
        Voorbeelden ({items.length} totaal{moreCount > 0 ? `, ${visibleItems.length} getoond` : ''})
      </h4>
      <ul className="space-y-2">
        {visibleItems.map((item, i) => (
          <li key={i} className="bg-white p-3 rounded border border-gray-200 text-xs">
            {typeof item === 'string' ? (
              <code className="break-all">{shortenString(item)}</code>
            ) : (
              <RenderItem item={item} pageUrl={pageUrl} />
            )}
          </li>
        ))}
      </ul>
      {moreCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-purple-700 hover:underline"
        >
          Toon alle {items.length} voorbeelden ({moreCount} meer)
        </button>
      )}
      {showAll && items.length > SOFT_LIMIT && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2 text-xs text-purple-700 hover:underline ml-4"
        >
          Klap in
        </button>
      )}
    </div>
  );
}
