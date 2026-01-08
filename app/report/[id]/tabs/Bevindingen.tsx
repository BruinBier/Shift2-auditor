'use client';

import { useState, useMemo } from 'react';
import {
  groupFindingsByHierarchy,
  getStatusLabel,
  getStatusColor,
} from '@/lib/report-calculations';

export default function Bevindingen({ project }: { project: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [responsibilityFilter, setResponsibilityFilter] = useState<string>('all');
  const [showOnlyPublished, setShowOnlyPublished] = useState(false);

  const groupedData = groupFindingsByHierarchy(project);

  // Filter data
  const filteredData = useMemo(() => {
    return groupedData
      .map((principle) => ({
        ...principle,
        guidelines: principle.guidelines
          .map((guideline) => ({
            ...guideline,
            criteria: guideline.criteria
              .map((criterion) => {
                const filteredFindings = criterion.findings.filter((finding: any) => {
                  // Search filter
                  if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    if (
                      !finding.description.toLowerCase().includes(searchLower) &&
                      !finding.advice.toLowerCase().includes(searchLower) &&
                      !finding.findingCode.toLowerCase().includes(searchLower)
                    ) {
                      return false;
                    }
                  }

                  // Status filter
                  if (statusFilter !== 'all' && finding.status !== statusFilter) {
                    return false;
                  }

                  // Impact filter
                  if (impactFilter !== 'all' && finding.impact !== impactFilter) {
                    return false;
                  }

                  // Responsibility filter
                  if (
                    responsibilityFilter !== 'all' &&
                    finding.responsibility !== responsibilityFilter
                  ) {
                    return false;
                  }

                  // Show only published
                  if (showOnlyPublished && finding.status !== 'published') {
                    return false;
                  }

                  return true;
                });

                return {
                  ...criterion,
                  findings: filteredFindings,
                };
              })
              .filter((c) => c.findings.length > 0 || c.assessment?.status === 'failed'),
          }))
          .filter((g) => g.criteria.length > 0),
      }))
      .filter((p) => p.guidelines.length > 0);
  }, [groupedData, searchTerm, statusFilter, impactFilter, responsibilityFilter, showOnlyPublished]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'kritiek':
        return 'bg-red-100 text-red-800';
      case 'matig':
        return 'bg-yellow-100 text-yellow-800';
      case 'klein':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactLabel = (impact: string) => {
    const labels: Record<string, string> = {
      kritiek: 'Kritiek',
      matig: 'Matig',
      klein: 'Klein',
      onbekend: 'Onbekend',
    };
    return labels[impact] || impact;
  };

  const getResponsibilityLabel = (responsibility: string) => {
    const labels: Record<string, string> = {
      ontwikkelaar: 'Ontwikkelaar',
      redacteur: 'Redacteur',
      ontwerper: 'Ontwerper',
      onbekend: 'Onbekend',
    };
    return labels[responsibility] || responsibility;
  };

  return (
    <div className="grid grid-cols-4 gap-8">
      {/* Main content */}
      <div className="col-span-3 space-y-8">
        {/* Header with title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: '#8f1cff' }}>Waarneembaar</span>
          </div>
        </div>

        {/* Hierarchical findings display */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Geen bevindingen gevonden met de huidige filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((principle) => (
              <div key={principle.principle} className="space-y-4">
                {principle.guidelines.map((guideline) => (
                  <div key={guideline.code} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {guideline.code} {guideline.title}
                    </h3>
                    {guideline.criteria.map((criterion) => (
                      <div
                        key={criterion.code}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                      >
                        {/* Criterion header */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">
                                {criterion.code}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {criterion.level}
                              </span>
                              <span className="text-sm text-gray-700">{criterion.title}</span>
                            </div>
                            {criterion.assessment && (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  criterion.assessment.status
                                )}`}
                              >
                                {getStatusLabel(criterion.assessment.status)}
                              </span>
                            )}
                          </div>
                          {criterion.understandingUrl && (
                            <a
                              href={criterion.understandingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Understanding SC {criterion.code}
                            </a>
                          )}
                        </div>

                        {/* Findings for this criterion */}
                        {criterion.findings.length > 0 && (
                          <div className="divide-y divide-gray-200">
                            {criterion.findings.map((finding: any) => (
                              <div key={finding.id} className="px-6 py-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      Bevinding {finding.findingCode}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(
                                        finding.impact
                                      )}`}
                                    >
                                      {getImpactLabel(finding.impact)}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {getResponsibilityLabel(finding.responsibility)}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                      Beschrijving
                                    </div>
                                    <div className="text-sm text-gray-600 whitespace-pre-line">
                                      {finding.description}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                      Advies
                                    </div>
                                    <div className="text-sm text-gray-600 whitespace-pre-line">
                                      {finding.advice}
                                    </div>
                                  </div>

                                  {finding.evidence && (
                                    <div>
                                      <div className="text-sm font-medium text-gray-700 mb-1">
                                        Bewijs
                                      </div>
                                      <div className="text-sm text-gray-600 whitespace-pre-line font-mono bg-gray-50 p-2 rounded">
                                        {finding.evidence}
                                      </div>
                                    </div>
                                  )}

                                  {finding.occurrences && finding.occurrences.length > 0 && (
                                    <div>
                                      <div className="text-sm font-medium text-gray-700 mb-2">
                                        Locaties ({finding.occurrences.length})
                                      </div>
                                      <div className="space-y-2">
                                        {finding.occurrences.map((occurrence: any) => (
                                          <div
                                            key={occurrence.id}
                                            className="text-sm text-gray-600 pl-4 border-l-2 border-gray-300"
                                          >
                                            <div className="font-medium">
                                              {occurrence.sampleItem.title}
                                            </div>
                                            {occurrence.url && (
                                              <div className="text-xs text-blue-600">
                                                {occurrence.url}
                                              </div>
                                            )}
                                            {occurrence.context && (
                                              <div className="text-xs text-gray-500 mt-1">
                                                {occurrence.context}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No findings but failed status */}
                        {criterion.findings.length === 0 &&
                          criterion.assessment?.status === 'failed' && (
                            <div className="px-6 py-4 text-sm text-gray-500">
                              Dit criterium is afgekeurd, maar er zijn nog geen bevindingen
                              geregistreerd.
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar filters */}
      <div className="space-y-6 no-print">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Filter bevindingen ({project.findings.length})
          </h3>

          {/* Search */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Zoeken
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek in bevindingen..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cardan-primary focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cardan-primary focus:border-transparent"
            >
              <option value="all">Alle statussen</option>
              <option value="open">Open</option>
              <option value="published">Gepubliceerd</option>
              <option value="resolved">Opgelost</option>
            </select>
          </div>

          {/* Impact filter */}
          <div className="mb-4">
            <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
              Impact
            </label>
            <select
              id="impact"
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cardan-primary focus:border-transparent"
            >
              <option value="all">Alle impact niveaus</option>
              <option value="kritiek">Kritiek</option>
              <option value="matig">Matig</option>
              <option value="klein">Klein</option>
              <option value="onbekend">Onbekend</option>
            </select>
          </div>

          {/* Responsibility filter */}
          <div className="mb-4">
            <label
              htmlFor="responsibility"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Verantwoordelijkheid
            </label>
            <select
              id="responsibility"
              value={responsibilityFilter}
              onChange={(e) => setResponsibilityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cardan-primary focus:border-transparent"
            >
              <option value="all">Alle verantwoordelijkheden</option>
              <option value="ontwikkelaar">Ontwikkelaar</option>
              <option value="redacteur">Redacteur</option>
              <option value="ontwerper">Ontwerper</option>
              <option value="onbekend">Onbekend</option>
            </select>
          </div>

          {/* Concept toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published-only"
              checked={showOnlyPublished}
              onChange={(e) => setShowOnlyPublished(e.target.checked)}
              className="h-4 w-4 text-shift2-primary focus:ring-cardan-primary border-gray-300 rounded"
            />
            <label htmlFor="published-only" className="ml-2 block text-sm text-gray-700">
              Alleen gepubliceerde bevindingen
            </label>
          </div>

          {/* Reset filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setImpactFilter('all');
              setResponsibilityFilter('all');
              setShowOnlyPublished(false);
            }}
            className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}
