'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    auditedByOrg: 'Shift2',
    version: '1',
    language: 'Nederlands',
    researchType: '',
    status: 'Gepland',
    researcherName: '',
    controllerName: '',
    plannedTime: '',
    dateStart: '',
    dateEnd: '',
    researchStartedOn: '',
    reportDate: '',
    description: '',
    isAnonymous: false,
    isPrivate: false,
    commissionedBy: '',
    clientProjectId: '',
    hasReinspection: false,
    reinspectionWeeks: 14,
    // Hidden fields with defaults
    subject: '',
    standard: 'WCAG 2.2',
    level: 'AA',
  });

  const [showAnonymousTooltip, setShowAnonymousTooltip] = useState(false);
  const [showPrivateTooltip, setShowPrivateTooltip] = useState(false);
  const [researchTypes, setResearchTypes] = useState<any[]>([]);
  const [opdrachtgevers, setOpdrachtgevers] = useState<any[]>([]);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [filteredClientProjects, setFilteredClientProjects] = useState<any[]>([]);

  // Fetch research types, opdrachtgevers, and client projects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch research types
        const researchTypesResponse = await fetch('/api/research-types');
        if (researchTypesResponse.ok) {
          const data = await researchTypesResponse.json();
          setResearchTypes(data);
        }

        // Fetch opdrachtgevers
        const opdrachtgeversResponse = await fetch('/api/opdrachtgevers');
        if (opdrachtgeversResponse.ok) {
          const data = await opdrachtgeversResponse.json();
          setOpdrachtgevers(data);
        }

        // Fetch client projects
        const clientProjectsResponse = await fetch('/api/client-projects');
        if (clientProjectsResponse.ok) {
          const data = await clientProjectsResponse.json();
          setClientProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter client projects when opdrachtgever changes
  useEffect(() => {
    if (formData.commissionedBy) {
      const filtered = clientProjects.filter(
        (project) => project.opdrachtgever.naam === formData.commissionedBy
      );
      setFilteredClientProjects(filtered);

      // Reset clientProjectId if current selection is not in filtered list
      if (formData.clientProjectId && !filtered.find(p => p.id === formData.clientProjectId)) {
        setFormData(prev => ({ ...prev, clientProjectId: '' }));
      }
    } else {
      setFilteredClientProjects([]);
      setFormData(prev => ({ ...prev, clientProjectId: '' }));
    }
  }, [formData.commissionedBy, clientProjects]);

  // Close tooltips when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tooltip-container')) {
        setShowAnonymousTooltip(false);
        setShowPrivateTooltip(false);
      }
    };

    if (showAnonymousTooltip || showPrivateTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnonymousTooltip, showPrivateTooltip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build payload
    const payload = {
      ...formData,
      version: parseInt(formData.version) || 1,
      dateStart: formData.dateStart ? new Date(formData.dateStart).toISOString() : null,
      dateEnd: formData.dateEnd ? new Date(formData.dateEnd).toISOString() : null,
      researchStartedOn: formData.researchStartedOn ? new Date(formData.researchStartedOn).toISOString() : null,
      reportDate: formData.reportDate ? new Date(formData.reportDate).toISOString() : new Date().toISOString(),
    };

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const project = await response.json();
      router.push(`/admin/projects/${project.id}`);
    } else {
      const error = await response.json();
      alert(`Er is een fout opgetreden: ${error.error || 'Onbekende fout'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logo and navigation */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2"
                className="h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>

            {/* Navigation menu in header */}
            <nav className="flex gap-8 text-sm">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/onderzoeken"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Onderzoeken
              </Link>
              <Link
                href="/admin/bevindingen"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bevindingen
              </Link>
              <Link
                href="/admin/beheer"
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
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

      {/* Title section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Rapport digitale toegankelijkheid</h1>
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Onderzoek bewerken</h2>
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Titel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel <span className="text-gray-400">vereist</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>

              {/* Project and Versie */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.auditedByOrg}
                    onChange={(e) => setFormData({ ...formData, auditedByOrg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="Shift2">Shift2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Versie
                  </label>
                  <input
                    type="number"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>
              </div>

              {/* Taal and Onderzoekstype */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taal
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="Nederlands">Nederlands</option>
                    <option value="Engels">Engels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onderzoekstype <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.researchType}
                    onChange={(e) => setFormData({ ...formData, researchType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {researchTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-gray-400">vereist</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                >
                  <option value="Gepland">Gepland</option>
                  <option value="In uitvoering">In uitvoering</option>
                  <option value="Controle">Controle</option>
                  <option value="In de wacht">In de wacht</option>
                  <option value="Gereed">Gereed</option>
                </select>
              </div>

              {/* Opdrachtgever and Project */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opdrachtgever
                  </label>
                  <select
                    value={formData.commissionedBy}
                    onChange={(e) => setFormData({ ...formData, commissionedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    {opdrachtgevers.map((opdr) => (
                      <option key={opdr.id} value={opdr.naam}>
                        {opdr.kenmerk} - {opdr.naam}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.clientProjectId}
                    onChange={(e) => setFormData({ ...formData, clientProjectId: e.target.value })}
                    disabled={!formData.commissionedBy}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecteer...</option>
                    {filteredClientProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Onderzoeker and Controleur */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onderzoeker <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.researcherName}
                    onChange={(e) => setFormData({ ...formData, researcherName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    <option value="Frits Karskens">Frits Karskens</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Controleur <span className="text-gray-400">vereist</span>
                  </label>
                  <select
                    required
                    value={formData.controllerName}
                    onChange={(e) => setFormData({ ...formData, controllerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  >
                    <option value="">Selecteer...</option>
                    <option value="Frits Karskens">Frits Karskens</option>
                  </select>
                </div>
              </div>

              {/* Geplande tijd */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geplande tijd
                </label>
                <input
                  type="text"
                  value={formData.plannedTime}
                  onChange={(e) => setFormData({ ...formData, plannedTime: e.target.value })}
                  placeholder="bijv. 40 uur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>

              {/* Startdatum and Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startdatum <span className="text-gray-400">vereist</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateStart}
                    onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline <span className="text-gray-400">vereist</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateEnd}
                    onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>
              </div>

              {/* Herinspectie */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasReinspection}
                      onChange={(e) => setFormData({ ...formData, hasReinspection: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Herinspectie inplannen</span>
                </div>
                {formData.hasReinspection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aantal weken na deadline
                    </label>
                    <select
                      value={formData.reinspectionWeeks}
                      onChange={(e) => setFormData({ ...formData, reinspectionWeeks: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary bg-white"
                    >
                      <option value="12">12 weken</option>
                      <option value="13">13 weken</option>
                      <option value="14">14 weken</option>
                      <option value="15">15 weken</option>
                      <option value="16">16 weken</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Er wordt automatisch een tweede project (v1.1) aangemaakt voor de herinspectie. Bevindingen worden gekopieerd wanneer v1.0 op "Gereed" wordt gezet.
                    </p>
                  </div>
                )}
              </div>

              {/* Onderzoek gestart op and Rapportdatum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onderzoek gestart op
                  </label>
                  <input
                    type="date"
                    value={formData.researchStartedOn}
                    onChange={(e) => setFormData({ ...formData, researchStartedOn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rapportdatum
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                  />
                </div>
              </div>

              {/* Beschrijving */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-8">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Anoniem</span>
                  <div className="relative tooltip-container">
                    <button
                      type="button"
                      onClick={() => setShowAnonymousTooltip(!showAnonymousTooltip)}
                      className="tooltip-button text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showAnonymousTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                        <div className="text-xs text-gray-700">
                          Zet 'Anoniem' aan als het project gevoelige data bevat. URL's uit je steekproef en scope worden verborgen in het publieke rapport.
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-8 border-transparent border-t-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shift2-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-shift2-primary"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Privé</span>
                  <div className="relative tooltip-container">
                    <button
                      type="button"
                      onClick={() => setShowPrivateTooltip(!showPrivateTooltip)}
                      className="tooltip-button text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showPrivateTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                        <div className="text-xs text-gray-700">
                          Zet 'Privé' aan om dit onderzoek af te schermen met een wachtwoord.
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-8 border-transparent border-t-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="mt-8">
              <button
                type="submit"
                className="w-full px-6 py-2 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#6b2d8f' }}
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
