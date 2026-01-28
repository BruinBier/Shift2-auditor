'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import 'md-editor-rt/lib/style.css';

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4 text-sm text-gray-500">Editor laden...</div>
});

export default function ProjectDetails({ project, relatedProjects = [] }: { project: any; relatedProjects?: any[] }) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [projectNotes, setProjectNotes] = useState<any[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [showBijlagenTooltip, setShowBijlagenTooltip] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [opdrachtgevers, setOpdrachtgevers] = useState<any[]>([]);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [filteredClientProjects, setFilteredClientProjects] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    commissionedBy: project.commissionedBy || '',
    clientProjectId: project.clientProjectId || '',
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [editorModalKey, setEditorModalKey] = useState(0);

  // Fetch opdrachtgevers, client projects, and notes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const opdrachtgeversResponse = await fetch('/api/opdrachtgevers');
        if (opdrachtgeversResponse.ok) {
          const data = await opdrachtgeversResponse.json();
          setOpdrachtgevers(data);
        }

        const clientProjectsResponse = await fetch('/api/client-projects');
        if (clientProjectsResponse.ok) {
          const data = await clientProjectsResponse.json();
          setClientProjects(data);
        }

        const notesResponse = await fetch(`/api/projects/${project.id}/notes`);
        if (notesResponse.ok) {
          const data = await notesResponse.json();
          setProjectNotes(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [project.id]);

  // Filter client projects when opdrachtgever changes
  useEffect(() => {
    if (editFormData.commissionedBy) {
      const filtered = clientProjects.filter(
        (proj) => proj.opdrachtgever.naam === editFormData.commissionedBy
      );
      setFilteredClientProjects(filtered);

      if (editFormData.clientProjectId && !filtered.find(p => p.id === editFormData.clientProjectId)) {
        setEditFormData(prev => ({ ...prev, clientProjectId: '' }));
      }
    } else {
      setFilteredClientProjects([]);
      setEditFormData(prev => ({ ...prev, clientProjectId: '' }));
    }
  }, [editFormData.commissionedBy, clientProjects]);

  // Close tooltip and modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showBijlagenTooltip) {
        setShowBijlagenTooltip(false);
      }
      if (e.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showBijlagenTooltip, showEditModal]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionedBy: editFormData.commissionedBy || null,
          clientProjectId: editFormData.clientProjectId || null,
        }),
      });

      if (response.ok) {
        // Refresh page to show updated data
        window.location.reload();
      } else {
        alert('Fout bij het opslaan van de wijzigingen');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Fout bij het opslaan van de wijzigingen');
    }
  };

  const handleSaveNotes = async () => {
    if (!newNoteContent.trim()) {
      alert('Notitie mag niet leeg zijn');
      return;
    }

    setIsSavingNotes(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: project.researcherName || 'Onbekend',
          content: newNoteContent,
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setProjectNotes([newNote, ...projectNotes]);
        setNewNoteContent('');
        setEditorKey(prev => prev + 1); // Force editor to reset
        alert('Notitie opgeslagen');
      } else {
        alert('Fout bij het opslaan van de notitie');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Fout bij het opslaan van de notitie');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
    setShowEditNoteModal(true);
  };

  const handleUpdateNote = async () => {
    if (!editingNoteContent.trim()) {
      alert('Notitie mag niet leeg zijn');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/notes/${editingNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editingNoteContent,
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setProjectNotes(projectNotes.map(n => n.id === updatedNote.id ? updatedNote : n));
        setShowEditNoteModal(false);
        setEditingNoteId(null);
        setEditingNoteContent('');
        alert('Notitie bijgewerkt');
      } else {
        alert('Fout bij het bijwerken van de notitie');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Fout bij het bijwerken van de notitie');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Weet je zeker dat je deze notitie wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjectNotes(projectNotes.filter(n => n.id !== noteId));
        alert('Notitie verwijderd');
      } else {
        alert('Fout bij het verwijderen van de notitie');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Fout bij het verwijderen van de notitie');
    }
  };

  // Calculate statistics from findings
  const findingsByImpact = {
    kritiek: project.findings?.filter((f: any) => f.impact === 'kritiek').length || 0,
    serieus: project.findings?.filter((f: any) => f.impact === 'serieus').length || 0,
    matig: project.findings?.filter((f: any) => f.impact === 'matig').length || 0,
    klein: project.findings?.filter((f: any) => f.impact === 'klein').length || 0,
    opmerking: project.findings?.filter((f: any) => f.impact === 'onbekend' || !f.impact).length || 0,
    samples: project.sampleItems?.length || 0,
    failed: project.criterionAssessments?.filter((a: any) => a.status === 'failed').length || 0,
  };

  const findingsByResponsibility = {
    redacteur: project.findings?.filter((f: any) => f.responsibility === 'redacteur').length || 0,
    ontwikkelaar: project.findings?.filter((f: any) => f.responsibility === 'ontwikkelaar').length || 0,
    ontwerper: project.findings?.filter((f: any) => f.responsibility === 'ontwerper').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Two column layout - 2/3 and 1/3 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Column 1: Onderzoeksdetails + Planning (2/3 width) */}
        <div className="col-span-2 space-y-6">
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
              <div className="text-sm text-gray-900">{project.researchType}</div>
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
              <label className="block text-sm text-gray-500 mb-1">Onderzoeker</label>
              <div className="text-sm text-gray-900">{project.researcherName || '-'}</div>
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

        {/* Planning */}
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

        {/* Project Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="font-semibold text-gray-900">Project</h3>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-sm text-shift2-primary hover:underline"
            >
              Bewerken
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Opdrachtgever:</span>
                <div className="text-gray-900 mt-1">{project.commissionedBy || '-'}</div>
              </div>
              {project.clientProject && (
                <>
                  <div>
                    <span className="font-medium text-gray-700">Project:</span>
                    <div className="text-gray-900 mt-1">{project.clientProject.name}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Projectdetails:</span>
                    <div
                      className="text-gray-900 mt-1 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: project.clientProject.details || 'Geen projectdetails' }}
                    />
                  </div>
                </>
              )}
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
                {relatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      Geen gerelateerde onderzoeken
                    </td>
                  </tr>
                ) : (
                  relatedProjects.map((relatedProject: any) => (
                    <tr key={relatedProject.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                          SHP-{relatedProject.version}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                          {relatedProject.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{relatedProject.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{relatedProject.version}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {relatedProject.reportDate ? format(new Date(relatedProject.reportDate), 'd MMMM yyyy', { locale: nl }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Pijl naar rechts - link naar detail pagina */}
                          <a
                            href={`/admin/projects/${relatedProject.id}`}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            title="Bekijk details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </a>

                          {/* 3-puntjes menu placeholder */}
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            title="Meer opties"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
            </div>
          </div>
          <div className="p-4">
            {/* Saved notes list */}
            {projectNotes.length > 0 && (
              <div className="mb-4 space-y-3">
                {projectNotes.map((note) => (
                  <div key={note.id} className="bg-gray-50 p-3 rounded-lg group relative">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm text-gray-900">{note.authorName}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          {format(new Date(note.createdAt), 'd MMM yyyy HH:mm', { locale: nl })}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Bewerk notitie"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Verwijder notitie"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="text-sm text-gray-500 mb-2 italic">Nieuwe notitie</div>

            <MdEditor
              key={editorKey}
              modelValue={newNoteContent}
              onChange={(value: string) => setNewNoteContent(value)}
              language="nl-NL"
              toolbars={['bold', 'underline', 'italic', '-', 'strikeThrough', 'title', '-', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-', 'codeRow', 'code', 'link', 'image', 'table', '-', 'revoke', 'next', '=', 'pageFullscreen', 'fullscreen', 'preview', 'catalog']}
              preview={false}
              className="min-h-[300px]"
            />

            <div className="mt-4">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingNotes ? 'Opslaan...' : 'Notitie opslaan'}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Column 2: Statistieken + Bijlagen */}
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
              <div className="space-y-3">
                {/* Bevindingen section */}
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Bevindingen</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">{findingsByImpact.failed}</span>
                      <span className="text-gray-700">Afgekeurd</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">{findingsByImpact.opmerking}</span>
                      <span className="text-gray-700">Opmerking</span>
                    </div>
                  </div>
                </div>

                {/* Impact section */}
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Impact</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border" style={{ borderColor: '#ffb3b3', color: '#bb2525' }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#bb2525' }}>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        {findingsByImpact.kritiek}
                      </span>
                      <span className="text-gray-700">kritiek</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border" style={{ borderColor: '#ffa64d', color: '#994d00' }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#994d00' }}>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        {findingsByImpact.serieus}
                      </span>
                      <span className="text-gray-700">serieus</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border" style={{ borderColor: '#d4a574', color: '#8b4513' }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#8b4513' }}>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        {findingsByImpact.matig}
                      </span>
                      <span className="text-gray-700">matig</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border" style={{ borderColor: '#d1d5db', color: '#000000' }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#000000' }}>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        {findingsByImpact.klein}
                      </span>
                      <span className="text-gray-700">klein</span>
                    </div>
                  </div>
                </div>

                {/* Verantwoordelijkheid section */}
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Verantwoordelijkheid</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{findingsByResponsibility.redacteur}</span>
                      <span className="text-gray-700">Redacteur</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">{findingsByResponsibility.ontwikkelaar}</span>
                      <span className="text-gray-700">Ontwikkelaar</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">{findingsByResponsibility.ontwerper}</span>
                      <span className="text-gray-700">Ontwerper</span>
                    </div>
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
                <div className="relative">
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowBijlagenTooltip(!showBijlagenTooltip)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showBijlagenTooltip && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowBijlagenTooltip(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-20">
                        Deze bijlagen worden alleen gebruikt voor interne doeleinden. Alleen bijlagen bij bevindingen zijn publiek toegankelijk en worden geëxporteerd in het rapport.
                        <div className="absolute left-4 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </>
                  )}
                </div>
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

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Project koppelen</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opdrachtgever
                </label>
                <select
                  value={editFormData.commissionedBy}
                  onChange={(e) => setEditFormData({ ...editFormData, commissionedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                >
                  <option value="">Geen opdrachtgever</option>
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
                  value={editFormData.clientProjectId}
                  onChange={(e) => setEditFormData({ ...editFormData, clientProjectId: e.target.value })}
                  disabled={!editFormData.commissionedBy}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Geen project</option>
                  {filteredClientProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {!editFormData.commissionedBy && (
                  <p className="mt-1 text-xs text-gray-500">Selecteer eerst een opdrachtgever</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {showEditNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Notitie bewerken</h2>
              <button
                onClick={() => {
                  setShowEditNoteModal(false);
                  setEditingNoteId(null);
                  setEditingNoteContent('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <MdEditor
                key={`edit-${editingNoteId}`}
                modelValue={editingNoteContent}
                onChange={(value: string) => setEditingNoteContent(value)}
                language="nl-NL"
                toolbars={['bold', 'underline', 'italic', '-', 'strikeThrough', 'title', '-', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-', 'codeRow', 'code', 'link', 'image', 'table', '-', 'revoke', 'next', '=', 'pageFullscreen', 'fullscreen', 'preview', 'catalog']}
                preview={false}
                className="min-h-[300px]"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowEditNoteModal(false);
                  setEditingNoteId(null);
                  setEditingNoteContent('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleUpdateNote}
                className="modal-save-button px-4 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 transition-opacity"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
