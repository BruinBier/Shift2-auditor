'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function ProjectDetails({ project }: { project: any }) {
  const [notes, setNotes] = useState('');

  // Calculate statistics from findings
  const findingsByImpact = {
    rejected: project.findings?.filter((f: any) => f.impact === 'rejected').length || 0,
    insufficient: project.findings?.filter((f: any) => f.impact === 'insufficient').length || 0,
    limited: project.findings?.filter((f: any) => f.impact === 'limited').length || 0,
    samples: project.sampleItems?.length || 0,
    structured: project.sampleItems?.filter((s: any) => s.sampleType === 'structured').length || 0,
    random: project.sampleItems?.filter((s: any) => s.sampleType === 'random').length || 0,
    deficient: project.findings?.filter((f: any) => f.status === 'deficient').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Three column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Column 1: Onderzoeksdetails */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="font-semibold text-gray-900">Onderzoeksdetails</h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Onderzoekstype</label>
              <div className="text-sm text-gray-900">
                {project.standard} {project.level} – {project.researchType}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Versie</label>
              <div className="text-sm text-gray-900">{project.version}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Taal</label>
              <div className="text-sm text-gray-900">{project.language}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Controleur</label>
              <div className="text-sm text-gray-900">{project.controllerName || '-'}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Beschrijving</label>
              <div className="text-sm text-gray-900">
                {project.description || 'Geen beschrijving'}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Planning */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold text-gray-900">Planning</h3>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Startdatum</label>
              <div className="text-sm text-gray-900">
                {project.dateStart ? format(new Date(project.dateStart), 'd MMMM yyyy', { locale: nl }) : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Onderzoek gestart op</label>
              <div className="text-sm text-gray-900">
                {project.researchStartedOn ? format(new Date(project.researchStartedOn), 'd MMMM yyyy', { locale: nl }) : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Deadline</label>
              <div className="text-sm text-gray-900">
                {project.dateEnd ? format(new Date(project.dateEnd), 'd MMMM yyyy', { locale: nl }) : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Rapportdatum</label>
              <div className="text-sm text-gray-900">
                {project.reportDate ? format(new Date(project.reportDate), 'd MMMM yyyy', { locale: nl }) : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Geplande tijd</label>
              <div className="text-sm text-gray-900">{project.plannedTime || '-'}</div>
            </div>
          </div>
        </div>

        {/* Column 3: Statistieken */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="font-semibold text-gray-900">Statistieken</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <label className="text-gray-600">Bevindingen</label>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-gray-700">{findingsByImpact.rejected} Afgekeurd</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span className="text-gray-700">{findingsByImpact.insufficient} Onvoldoende</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-gray-700">{findingsByImpact.limited} Matig</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="text-gray-700">{findingsByImpact.samples} Steekproef</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-gray-700">{findingsByImpact.structured} Gestructureerd</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-gray-700">{findingsByImpact.random} Willekeurig</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span className="text-gray-700">{findingsByImpact.deficient} Onvoldaan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bijlagen */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Bijlagen</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <button className="text-purple-600 hover:underline">Upload bestand</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">Geen bestanden</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="font-semibold text-gray-900">Project</h3>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="font-medium">Opdrachtgever:</span>
              <span>{project.commissionedBy || 'Shift2'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Projectdetails:</span>
              <span>Shift2</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Notities:</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gerelateerde onderzoeken */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Gerelateerde onderzoeken</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kenmerk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rapportdatum</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  Geen gerelateerde onderzoeken
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notities */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Notities</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-2 text-sm text-gray-500">Geen notities.</div>
          <div className="mb-2 text-sm text-gray-500 italic">Nieuwe notitie</div>

          {/* Rich text editor toolbar */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2">
              <button className="p-1 hover:bg-gray-200 rounded" title="Bold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 5H7v10h4a5 5 0 000-10z"/>
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Italic">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 5h2l-2 10H8l2-10z"/>
                </svg>
              </button>
              <div className="w-px bg-gray-300"></div>
              <button className="p-1 hover:bg-gray-200 rounded" title="Bulleted List">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 6a2 2 0 100-4 2 2 0 000 4zM4 12a2 2 0 100-4 2 2 0 000 4zM4 18a2 2 0 100-4 2 2 0 000 4zM8 5h10v2H8V5zM8 11h10v2H8v-2zM8 17h10v2H8v-2z"/>
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Numbered List">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4v2h2V4H3zM3 10v2h2v-2H3zM3 16v2h2v-2H3zM8 5h10v2H8V5zM8 11h10v2H8v-2zM8 17h10v2H8v-2z"/>
                </svg>
              </button>
              <div className="w-px bg-gray-300"></div>
              <button className="p-1 hover:bg-gray-200 rounded" title="Link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Code Block">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Image">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <div className="w-px bg-gray-300"></div>
              <button className="p-1 hover:bg-gray-200 rounded" title="Undo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-200 rounded" title="Redo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
              <div className="ml-auto flex gap-2">
                <button className="p-1 hover:bg-gray-200 rounded" title="Fullscreen">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button className="p-1 hover:bg-gray-200 rounded" title="Help">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 min-h-[200px] focus:outline-none resize-none"
              placeholder="Typ hier uw notities..."
            />
          </div>

          <div className="mt-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
              Notities opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
