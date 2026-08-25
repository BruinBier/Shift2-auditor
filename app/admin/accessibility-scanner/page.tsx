'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScanResult {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    html: string;
    target: string[];
    failureSummary?: string;

  }[];
}

interface AxeResults {
  violations: ScanResult[];
  passes: ScanResult[];
  incomplete: ScanResult[];
}

interface ScanResponse {
  success: boolean;
  url: string;
  timestamp: string;
  screenshot?: string;
  motor?: { naam: string; versie: string };
  results: AxeResults;
}

export default function AccessibilityScannerPage() {
  const [mounted, setMounted] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<AxeResults | null>(null);
  const [motor, setMotor] = useState<{ naam: string; versie: string } | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close Beheer menu on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBeheerMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showBeheerMenu && !target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu]);

  const runScan = async () => {
    if (!url) {
      setError('Voer een URL in');
      return;
    }

    setScanning(true);
    setError(null);
    setResults(null);
    setMotor(null);

    try {
      // Call backend API to scan external URL
      const response = await fetch('/api/scan-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan mislukt');
      }

      const data = await response.json();

      setScreenshot(data.screenshot || null);
      setMotor(data.motor || null);
      setResults({
        violations: data.results.violations as ScanResult[],
        passes: data.results.passes as ScanResult[],
        incomplete: data.results.incomplete as ScanResult[]
      });
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het scannen');
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'serious': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-shift2-primary text-white">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2"
                className="h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <nav className="flex gap-8 text-sm">
              <Link href="/admin" className="flex items-center gap-2 text-white hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link href="/onderzoeken" className="flex items-center gap-2 text-white hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link href="/admin/bevindingen" className="flex items-center gap-2 text-white hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowBeheerMenu(!showBeheerMenu)}
                  className="beheer-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Beheer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showBeheerMenu && (
                  <div className="beheer-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link href="/admin/onderzoekstypen" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Onderzoekstypen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>
                    <Link href="/admin/projecten" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Projecten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </Link>
                    <Link href="/admin/opdrachtgevers" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Opdrachtgevers
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link href="/admin/crawler-tests" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Crawler tests
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Link>
                    <Link href="/admin/accessibility-scanner" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Accessibility Scanner
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Link>
                    <Link href="/admin/beoordelingen" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Beoordelingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    <Link href="/admin/team" onClick={() => setShowBeheerMenu(false)} className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700" style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Team
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Accessibility Scanner (axe-core)</h1>

        {/* Scanner Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Voer URL in om te scannen (bijv. https://example.com)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-shift2-primary"
            />
            <button
              onClick={runScan}
              disabled={scanning}
              className="px-6 py-2 bg-shift2-primary text-white rounded-md hover:bg-shift2-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scannen...
                </>
              ) : (
                'Scan starten'
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>axe-core</strong> is een open-source accessibility testing engine van Deque Systems, die uitgebreide WCAG-regels bevat sinds 2015.</p>
            <p className="mt-2">Deze scanner gebruikt een headless browser (Puppeteer) om externe websites te scannen en accessibility problemen te detecteren volgens WCAG 2.0/2.1/2.2 richtlijnen.</p>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {motor && (
              <p className="text-sm text-gray-600">
                Gemeten met <strong>{motor.naam} {motor.versie}</strong>. Die versie komt uit
                package.json, niet van een CDN: dezelfde pagina levert morgen dezelfde uitslag.
              </p>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Violations</p>
                    <p className="text-3xl font-bold text-red-600">{results.violations.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Passes</p>
                    <p className="text-3xl font-bold text-green-600">{results.passes.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Incomplete</p>
                    <p className="text-3xl font-bold text-yellow-600">{results.incomplete.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Snapshot */}
            {screenshot && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Visual Snapshot</h2>
                </div>
                <div className="p-6">
                  <img
                    src={screenshot}
                    alt="Website screenshot"
                    className="w-full border border-gray-300 rounded shadow-sm"
                  />
                  <p className="text-sm text-gray-600 mt-4">
                    Full-page screenshot opgeslagen in <code className="bg-gray-100 px-2 py-1 rounded">__visual-snapshots__</code>
                  </p>
                </div>
              </div>
            )}

            {/* Violations Details */}
            {results.violations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                  <h2 className="text-lg font-semibold text-red-900">Violations ({results.violations.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {results.violations.map((violation, index) => (
                    <div key={index} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{violation.help}</h3>
                          <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getImpactColor(violation.impact)}`}>
                          {violation.impact}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Gevonden in {violation.nodes.length} element(en)</strong>
                        </p>
                        <a
                          href={violation.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Meer informatie
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                        <div key={nodeIndex} className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs font-mono text-gray-700 mb-2">
                            <strong>Selector:</strong> {node.target.join(', ')}
                          </p>
                          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
                            {node.html}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}