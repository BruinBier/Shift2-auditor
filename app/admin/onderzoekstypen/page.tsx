'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ResearchType {
  id: string;
  name: string;
  version: string;
  level: string;
  type: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function OnderzoekstypenPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: 'WCAG 2.2',
    level: 'AA',
    type: 'website',
    reportIntro: '',
    selectedCriteria: [] as string[],
  });

  // Mock data - dit wordt later vervangen door echte data uit de database
  const researchTypes: ResearchType[] = [
    {
      id: '1',
      name: 'WCAG 2.2 AA onderzoek',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      description: 'Volledig onderzoek op 55 succescriteria, conform WCAG 2.2.',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-03-20'),
    },
    {
      id: '2',
      name: 'WCAG 2.2 AA deelonderzoek content',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      description: 'Deelonderzoek content, conform WCAG-EM. Dit onderzoek bevat 33 succescriteria die betrekking hebben op de content van de website.',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-04-15'),
    },
    {
      id: '3',
      name: 'Trial onderzoek',
      version: 'WCAG 2.2',
      level: 'AA',
      type: 'website',
      description: 'Proef-onderzoek om de functionaliteiten van Cardan Auditor te ervaren',
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-05-12'),
    },
    {
      id: '4',
      name: 'WCAG 2.2 AA – aanvullend deelonderzoek content',
      version: '',
      level: 'AA',
      type: 'website',
      description: 'Aanvullend deelonderzoek gericht op klantspecifieke content binnen de Mijn-omgeving. Dit onderzoekstype wordt gebruikt als aanvulling op een eerder volledig WCAG 2.2 AA-onderzoek van de standaard PIP-omgeving en heeft een afgebakende scope.',
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-06-08'),
    },
  ];

  // Filter and search
  const filteredTypes = researchTypes.filter((type) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      type.name.toLowerCase().includes(searchLower) ||
      type.description.toLowerCase().includes(searchLower) ||
      type.version.toLowerCase().includes(searchLower)
    );
  });

  // Sort
  const sortedTypes = [...filteredTypes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'createdAt':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'updatedAt':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'version':
        return a.version.localeCompare(b.version);
      case 'level':
        return a.level.localeCompare(b.level);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Navigation */}
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
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
              <Link
                href="/admin/beheer"
                className="flex items-center gap-2 text-white hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Beheer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Header with title and button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h1 className="text-2xl font-semibold">Onderzoekstypen ({sortedTypes.length})</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Nieuw onderzoekstype
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-shift2-primary"
              >
                <option value="name">Naam</option>
                <option value="createdAt">Datum aangemaakt</option>
                <option value="updatedAt">Laatst gewijzigd</option>
                <option value="version">WCAG versie</option>
                <option value="level">Conformiteitsniveau</option>
                <option value="type">Content type</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="zoeken"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-1.5 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{type.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{type.version}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{type.level}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {type.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{type.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &laquo;
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &lsaquo;
            </button>
            <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm">1</span>
            <span className="text-sm text-gray-600">van 1</span>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &rsaquo;
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed">
              &raquo;
            </button>
          </div>
          <div>
            <select className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option>20 items per pagina</option>
              <option>50 items per pagina</option>
              <option>100 items per pagina</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Nieuw onderzoekstype</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('succescriteria')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'succescriteria'
                    ? 'border-shift2-primary text-shift2-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Succescriteria
              </button>
            </div>

            {/* Content */}
            <form className="p-6 space-y-6">
              {activeTab === 'details' && (
                <>
                  {/* Naam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam <span className="text-gray-400">vereist</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  {/* Beschrijving */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving <span className="text-gray-400">vereist</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                    />
                  </div>

                  {/* WCAG versie, Conformiteitsniveau, Content type */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WCAG versie</label>
                      <select
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      >
                        <option value="WCAG 2.2">WCAG 2.2</option>
                        <option value="WCAG 2.1">WCAG 2.1</option>
                        <option value="WCAG 2.0">WCAG 2.0</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conformiteitsniveau</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      >
                        <option value="A">A</option>
                        <option value="AA">AA</option>
                        <option value="AAA">AAA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                      >
                        <option value="website">Website</option>
                        <option value="app">App</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                  </div>

                  {/* Rapport inleiding */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rapport inleiding</label>
                    <div className="border border-gray-300 rounded-md">
                      {/* Toolbar */}
                      <div className="flex items-center gap-2 p-2 border-b border-gray-300 bg-gray-50">
                        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Bold">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3H6v14h5a4 4 0 000-8 4 4 0 000-8zm-1 6V5h1a2 2 0 110 4h-1zm0 2h1a2 2 0 110 4h-1v-4z" />
                          </svg>
                        </button>
                        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Italic">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3h8v2h-2.5l-3 10H13v2H5v-2h2.5l3-10H8V3z" />
                          </svg>
                        </button>
                        <div className="w-px h-5 bg-gray-300 mx-1"></div>
                        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Bullet list">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Numbered list">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                        </button>
                      </div>
                      {/* Text area */}
                      <textarea
                        value={formData.reportIntro}
                        onChange={(e) => setFormData({ ...formData, reportIntro: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 focus:outline-none focus:ring-0 border-0 resize-none"
                      />
                    </div>
                  </div>

                  {/* Opslaan button */}
                  <div className="flex justify-start pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Opslaan
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'succescriteria' && (
                <>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Selecteer succescriteria</h3>
                    <div className="max-h-[500px] overflow-y-auto border border-gray-300 rounded-md">
                      <div className="divide-y divide-gray-200">
                        {[
                          { id: '1.1', name: 'Niet-tekstuele content', level: 'A' },
                          { id: '1.2.1', name: 'Louter-geluid en louter-videobeeld (vooraf opgenomen)', level: 'A' },
                          { id: '1.2.2', name: 'Ondertitels voor doven en slechthorenden (vooraf opgenomen)', level: 'A' },
                          { id: '1.2.3', name: 'Audiodescriptie of media-alternatief (vooraf opgenomen)', level: 'A' },
                          { id: '1.2.4', name: 'Ondertitels voor doven en slechthorenden (live)', level: 'AA' },
                          { id: '1.2.5', name: 'Audiodescriptie (vooraf opgenomen)', level: 'AA' },
                          { id: '1.3.1', name: 'Info en relaties', level: 'A' },
                          { id: '1.3.2', name: 'Betekenisvolle volgorde', level: 'A' },
                          { id: '1.3.3', name: 'Zintuiglijke eigenschappen', level: 'A' },
                          { id: '1.3.4', name: 'Weergavestand', level: 'AA' },
                          { id: '1.3.5', name: 'Identificeer het doel van de input', level: 'AA' },
                          { id: '1.4.1', name: 'Gebruik van kleur', level: 'A' },
                          { id: '1.4.2', name: 'Geluidsbediening', level: 'A' },
                          { id: '1.4.3', name: 'Contrast (minimum)', level: 'AA' },
                          { id: '1.4.4', name: 'Herschalen van tekst', level: 'AA' },
                          { id: '1.4.5', name: 'Afbeeldingen van tekst', level: 'AA' },
                          { id: '1.4.10', name: 'Reflow', level: 'AA' },
                          { id: '1.4.11', name: 'Contrast van niet-tekstuele content', level: 'AA' },
                          { id: '1.4.12', name: 'Tekstafstand', level: 'AA' },
                          { id: '1.4.13', name: 'Content bij hover of focus', level: 'AA' },
                          { id: '2.1.1', name: 'Toetsenbord', level: 'A' },
                          { id: '2.1.2', name: 'Geen toetsenbordval', level: 'A' },
                          { id: '2.1.4', name: 'Enkel teken sneltoetsen', level: 'A' },
                          { id: '2.2.1', name: 'Timing aanpasbaar', level: 'A' },
                          { id: '2.2.2', name: 'Pauzeren, stoppen, verbergen', level: 'A' },
                          { id: '2.3.1', name: 'Drie flitsen of beneden drempelwaarde', level: 'A' },
                          { id: '2.4.1', name: 'Blokken omzeilen', level: 'A' },
                          { id: '2.4.2', name: 'Paginatitel', level: 'A' },
                          { id: '2.4.3', name: 'Focus volgorde', level: 'A' },
                          { id: '2.4.4', name: 'Linkdoel (in context)', level: 'A' },
                          { id: '2.4.5', name: 'Meerdere manieren', level: 'AA' },
                          { id: '2.4.6', name: 'Koppen en labels', level: 'AA' },
                          { id: '2.4.7', name: 'Focus zichtbaar', level: 'AA' },
                          { id: '2.5.1', name: 'Aanwijzergebaren', level: 'A' },
                          { id: '2.5.2', name: 'Aanwijzerannulering', level: 'A' },
                          { id: '2.5.3', name: 'Label in naam', level: 'A' },
                          { id: '2.5.4', name: 'Bewegingsactivering', level: 'A' },
                          { id: '3.1.1', name: 'Taal van de pagina', level: 'A' },
                          { id: '3.1.2', name: 'Taal van onderdelen', level: 'AA' },
                          { id: '3.2.1', name: 'Bij focus', level: 'A' },
                          { id: '3.2.2', name: 'Bij input', level: 'A' },
                          { id: '3.2.3', name: 'Consistente navigatie', level: 'AA' },
                          { id: '3.2.4', name: 'Consistente identificatie', level: 'AA' },
                          { id: '3.3.1', name: 'Fout identificatie', level: 'A' },
                          { id: '3.3.2', name: 'Labels of instructies', level: 'A' },
                          { id: '3.3.3', name: 'Foutsuggestie', level: 'AA' },
                          { id: '3.3.4', name: 'Foutpreventie (wettelijk, financieel, gegevens)', level: 'AA' },
                          { id: '4.1.1', name: 'Parsen', level: 'A' },
                          { id: '4.1.2', name: 'Naam, rol, waarde', level: 'A' },
                          { id: '4.1.3', name: 'Statusberichten', level: 'AA' },
                        ].map((criterion) => {
                          const isSelected = formData.selectedCriteria.includes(criterion.id);
                          return (
                            <label
                              key={criterion.id}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      selectedCriteria: [...formData.selectedCriteria, criterion.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedCriteria: formData.selectedCriteria.filter((id) => id !== criterion.id),
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-shift2-primary border-gray-300 rounded focus:ring-shift2-primary"
                              />
                              <span className="ml-3 text-sm text-gray-700 flex-1">{criterion.id} - {criterion.name}</span>
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                {criterion.level}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Opslaan button */}
                  <div className="flex justify-start pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-shift2-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Opslaan
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
