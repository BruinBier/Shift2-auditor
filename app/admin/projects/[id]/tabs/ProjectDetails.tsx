'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import VoorbereidingStappen from './VoorbereidingStappen';
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
  const [projectStatus, setProjectStatus] = useState(project.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [planningChanges, setPlanningChanges] = useState<any[]>([]);
  const [postponeWeeks, setPostponeWeeks] = useState('2');
  const [postponeReason, setPostponeReason] = useState('');
  const [isPostponing, setIsPostponing] = useState(false);
  const [planningFormData, setPlanningFormData] = useState({
    dateStart: project.dateStart ? new Date(project.dateStart).toISOString().split('T')[0] : '',
    dateEnd: project.dateEnd ? new Date(project.dateEnd).toISOString().split('T')[0] : '',
    hasReinspection: Boolean(project.hasReinspection),
    reinspectionWeeks: project.reinspectionWeeks ? String(project.reinspectionWeeks) : '12',
    planningSent: project.planningSent ? new Date(project.planningSent).toISOString().split('T')[0] : '',
    planningApproved: project.planningApproved ? new Date(project.planningApproved).toISOString().split('T')[0] : '',
    scopeInScope: project.scopeInScope || '',
    scopeOutOfScope: project.scopeOutOfScope || '',
    sampleClientPages: project.sampleClientPages || '',
  });

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

        const changesResponse = await fetch(`/api/projects/${project.id}/postpone`);
        if (changesResponse.ok) {
          const data = await changesResponse.json();
          if (Array.isArray(data)) setPlanningChanges(data);
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

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus) return;

    const confirmed = confirm(`Weet je zeker dat je de status wilt wijzigen naar "${newStatus}"?`);
    if (!confirmed) {
      // Reset dropdown to current value
      setProjectStatus(project.status);
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setProjectStatus(newStatus);
        alert('Status succesvol bijgewerkt!');
        window.location.reload();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Er is een fout opgetreden bij het bijwerken van de status. Probeer het opnieuw.');
      setProjectStatus(project.status); // Reset to original status
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle planning submit
  const handlePlanningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateStart: planningFormData.dateStart ? new Date(planningFormData.dateStart).toISOString() : null,
          dateEnd: planningFormData.dateEnd ? new Date(planningFormData.dateEnd).toISOString() : null,
          // De rapportdatum is de deadline: bij de intake staat die nog op de
          // dag van aanmaken, omdat de planning dan nog niet bekend is.
          ...(planningFormData.dateEnd
            ? { reportDate: new Date(planningFormData.dateEnd).toISOString() }
            : {}),
          hasReinspection: planningFormData.hasReinspection,
          reinspectionWeeks: planningFormData.hasReinspection
            ? Number(planningFormData.reinspectionWeeks) || null
            : null,
          planningSent: planningFormData.planningSent ? new Date(planningFormData.planningSent).toISOString() : null,
          planningApproved: planningFormData.planningApproved ? new Date(planningFormData.planningApproved).toISOString() : null,
          scopeInScope: planningFormData.scopeInScope || null,
          scopeOutOfScope: planningFormData.scopeOutOfScope || null,
          sampleClientPages: planningFormData.sampleClientPages || null,
        }),
      });

      if (response.ok) {
        alert('Planning datums succesvol bijgewerkt!');
        window.location.reload();
      } else {
        alert('Fout bij het opslaan van de planning datums');
      }
    } catch (error) {
      console.error('Error updating planning:', error);
      alert('Fout bij het opslaan van de planning datums');
    }
  };

  /**
   * Een onderzoek loopt standaard twee weken; de herinspectie start een aantal
   * weken na de deadline en duurt een week. Je geeft de startdatum, de rest
   * volgt daaruit maar blijft aanpasbaar.
   */
  const LOOPTIJD_DAGEN = 14;

  const plusDagen = (datum: string, dagen: number) => {
    if (!datum) return '';
    const d = new Date(`${datum}T00:00:00`);
    d.setDate(d.getDate() + dagen);
    return d.toISOString().split('T')[0];
  };

  const zetStartdatum = (nieuweStart: string) => {
    setPlanningFormData((vorige) => ({
      ...vorige,
      dateStart: nieuweStart,
      // De deadline schuift mee zolang die het standaardpatroon volgt of nog
      // leeg is. Een handmatig afwijkende deadline blijft staan.
      dateEnd:
        !vorige.dateEnd || vorige.dateEnd === plusDagen(vorige.dateStart, LOOPTIJD_DAGEN)
          ? plusDagen(nieuweStart, LOOPTIJD_DAGEN)
          : vorige.dateEnd,
    }));
  };

  const herinspectieStart = planningFormData.hasReinspection
    ? plusDagen(planningFormData.dateEnd, Number(planningFormData.reinspectionWeeks || 0) * 7)
    : '';

  /**
   * Maakt van een tekstvak een opsomming: bij Enter komt er meteen een streepje
   * op de nieuwe regel, en geplakte tekst krijgt er per regel een.
   * Zo hoeft de opmaak niet met de hand te worden bijgehouden.
   */
  const bulletVeld = (
    waarde: string,
    zet: (nieuw: string) => void
  ) => ({
    value: waarde,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => zet(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      const el = e.currentTarget;
      const voor = waarde.slice(0, el.selectionStart);
      const na = waarde.slice(el.selectionEnd);
      const nieuw = `${voor}\n- ${na}`;
      zet(nieuw);
      // Cursor achter het nieuwe streepje zetten.
      const positie = voor.length + 3;
      requestAnimationFrame(() => el.setSelectionRange(positie, positie));
    },
    onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const tekst = e.clipboardData.getData('text');
      if (!tekst.includes('\n')) return;
      e.preventDefault();
      const el = e.currentTarget;
      const regels = tekst
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => (/^[-*•]\s/.test(r) ? r : `- ${r}`));
      const voor = waarde.slice(0, el.selectionStart);
      const na = waarde.slice(el.selectionEnd);
      const prefix = voor && !voor.endsWith('\n') ? '\n' : '';
      zet(`${voor}${prefix}${regels.join('\n')}${na}`);
    },
  });

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTranscript(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeCallTranscript: transcript.trim() || null }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Het opslaan van het transcript is niet gelukt.');
      }
    } catch (error) {
      console.error('Error saving transcript:', error);
      alert('Het opslaan van het transcript is niet gelukt.');
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const handlePostponeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postponeReason.trim()) {
      alert('Geef een reden voor het uitstel.');
      return;
    }

    setIsPostponing(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeks: Number(postponeWeeks),
          reason: postponeReason.trim(),
          authorName: project.researcherName || undefined,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.error || 'Het uitstellen is niet gelukt.');
      }
    } catch (error) {
      console.error('Error postponing planning:', error);
      alert('Het uitstellen is niet gelukt.');
    } finally {
      setIsPostponing(false);
    }
  };

  // Import planning scope/sample fields into real records
  const [isImporting, setIsImporting] = useState(false);
  const handleImportPlanning = async () => {
    const hasContent =
      project.scopeInScope || project.scopeOutOfScope || project.sampleClientPages;
    if (!hasContent) {
      alert("Er zijn geen scope- of steekproefpagina's in de planning ingevuld om te importeren.");
      return;
    }
    if (
      !confirm(
        "De ingevulde scope-URL's en door de klant aangedragen pagina's worden toegevoegd aan de scope en de steekproef van dit project. Pagina's die er al staan worden overgeslagen. Doorgaan?"
      )
    ) {
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/import-planning`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        const parts: string[] = [];
        if (data.scopeInScopeCreated) parts.push(`${data.scopeInScopeCreated} in scope`);
        if (data.scopeOutOfScopeCreated) parts.push(`${data.scopeOutOfScopeCreated} buiten scope`);
        if (data.sampleItemsCreated) parts.push(`${data.sampleItemsCreated} steekproefpagina(s)`);
        const summary = parts.length ? parts.join(', ') : 'niets nieuws';
        const skipped = data.skipped ? ` (${data.skipped} overgeslagen, bestaan al)` : '';
        alert(`Import voltooid: ${summary}${skipped}.`);
        window.location.reload();
      } else {
        alert(`Fout bij importeren: ${data.error || 'onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error importing planning:', error);
      alert('Fout bij het importeren van de planning');
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * De afspraken die bij de nulmeting zijn gemaakt: wanneer de planning is
   * verstuurd en akkoord bevonden, en wat er is afgesproken over scope en
   * steekproef. Bij een vervolgonderzoek horen deze onder het kopje
   * Nulmeting, want daar zijn ze vastgelegd.
   */
  const planningAfspraken = (() => {
    // De afspraken zijn bij de nulmeting vastgelegd. Bij een vervolgonderzoek
    // staan ze dus op het bovenliggende project; bij een nulmeting op het
    // project zelf.
    const bron = project.parentProject ?? project;

    // URL's per regel als klikbare link tonen. Losse tekst met lange, gecodeerde
    // PDF-adressen wordt anders een onleesbaar blok.
    const alsLijst = (waarde: string | null | undefined) => {
      const regels = (waarde || '')
        .split('\n')
        .map((r) => r.trim().replace(/^[-*•]\s*/, '')) // een getypt streepje hoort bij de opmaak, niet bij de tekst
        .filter(Boolean);
      if (!regels.length) return <div className="text-sm text-gray-900">-</div>;
      return (
        <ul className="list-disc list-outside pl-5 space-y-1 marker:text-gray-400">
          {regels.map((r, i) => (
            <li key={i} className="text-sm">
              {/^https?:\/\//i.test(r) ? (
                <a
                  href={r}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-shift2-primary hover:underline break-all"
                >
                  {decodeURI(r).replace(/^https?:\/\/(www\.)?/i, '')}
                </a>
              ) : (
                <span className="text-gray-900">{r}</span>
              )}
            </li>
          ))}
        </ul>
      );
    };

    return (
    <>
      <div>
        <label className="block text-sm text-gray-500 mb-1">Planning verstuurd</label>
        <div className="text-sm text-gray-900">
          {bron.planningSent ? format(new Date(bron.planningSent), 'd MMMM yyyy', { locale: nl }) : '-'}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">Planning akkoord</label>
        <div className="text-sm text-gray-900">
          {bron.planningApproved ? format(new Date(bron.planningApproved), 'd MMMM yyyy', { locale: nl }) : '-'}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">In scope</label>
        {alsLijst(bron.scopeInScope)}
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">Buiten scope</label>
        {alsLijst(bron.scopeOutOfScope)}
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">Door klant aangedragen pagina&apos;s</label>
        {alsLijst(bron.sampleClientPages)}
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={handleImportPlanning}
          disabled={isImporting}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-shift2-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isImporting ? 'Bezig met importeren...' : 'Importeer naar scope & steekproef'}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Zet de scope-URL&apos;s om naar scope-items en de aangedragen pagina&apos;s naar de steekproef. Bestaande pagina&apos;s worden overgeslagen.
        </p>
      </div>
    </>
    );
  })();

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
              <label className="block text-sm text-gray-500 mb-1">Status</label>
              <select
                value={projectStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Intake">Intake</option>
                <option value="Gepland">Gepland</option>
                <option value="In uitvoering">In uitvoering</option>
                <option value="Controle">Controle</option>
                <option value="In de wacht">In de wacht</option>
                <option value="Gereed">Gereed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Onderzoekstype</label>
              <div className="text-sm text-gray-900">{project.researchType}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Versie</label>
              <div className="text-sm text-gray-900">{Number(project.version).toFixed(1)}</div>
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
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-semibold text-gray-900">Planning</h3>
            </div>
            <button
              onClick={() => setShowPlanningModal(true)}
              className="text-sm text-shift2-primary hover:underline"
            >
              Bewerken
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Bij een vervolgonderzoek eerst de nulmeting, zodat je ziet
                vanaf welk moment de hersteltermijn loopt. */}
            {project.parentProject && (
              <div className="pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Nulmeting
                  </div>
                  {/* De nulmeting is een ander onderzoek; die planning verplaats
                      je op zijn eigen pagina, niet van hieruit. */}
                  <button
                    type="button"
                    disabled
                    title="De planning van de nulmeting pas je aan op de pagina van dat onderzoek."
                    className="text-sm text-gray-300 cursor-not-allowed"
                  >
                    Uitstellen
                  </button>
                </div>
                <div className="text-sm text-gray-900">
                  {project.parentProject.dateStart && project.parentProject.dateEnd
                    ? `${format(new Date(project.parentProject.dateStart), 'd MMMM', { locale: nl })} tot ${format(new Date(project.parentProject.dateEnd), 'd MMMM yyyy', { locale: nl })}`
                    : 'Nog niet gepland'}
                </div>
                {project.parentProject.reportDate && (
                  <div className="text-sm text-gray-500 mt-1">
                    Rapport {format(new Date(project.parentProject.reportDate), 'd MMMM yyyy', { locale: nl })}
                    {(() => {
                      const weken = Math.floor(
                        (Date.now() - new Date(project.parentProject.reportDate).getTime()) /
                          (7 * 24 * 60 * 60 * 1000)
                      );
                      if (weken < 1) return null;
                      return ` (${weken} ${weken === 1 ? 'week' : 'weken'} geleden)`;
                    })()}
                  </div>
                )}
                <div className="mt-3 space-y-3">{planningAfspraken}</div>
              </div>
            )}
            {/* Dit kopje benoemt wélk onderzoek dit is, niet in welke fase het
                zit. Een vervolgonderzoek is een herinspectie, of het nu in de
                tussencheck of de eindcontrole zit; die fase staat boven aan de
                pagina. */}
            <div className="flex items-center justify-between">
              {project.parentProject ? (
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Herinspectie
                </div>
              ) : (
                <span />
              )}
              {/* Een afgerond onderzoek verplaats je niet meer. */}
              {(() => {
                const heeftPlanning = Boolean(project.dateStart || project.dateEnd);
                // projectStatus volgt de keuzelijst hierboven, zodat de knop
                // meteen meebeweegt als je de status wijzigt.
                const afgerond = projectStatus === 'Gereed' || projectStatus === 'Geannuleerd';
                if (!heeftPlanning) return null;
                if (afgerond) {
                  return (
                    <button
                      type="button"
                      disabled
                      title="Dit onderzoek is afgerond en kan niet meer worden verplaatst."
                      className="text-sm text-gray-300 cursor-not-allowed"
                    >
                      Uitstellen
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => setShowPostponeModal(true)}
                    className="text-sm text-shift2-primary hover:underline"
                  >
                    Uitstellen
                  </button>
                );
              })()}
            </div>
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
            {/* Staat er een hertest gepland, toon dan wanneer die valt. Het
                v1.1-project wordt pas aangemaakt bij het afronden van dit
                onderzoek, want dan pas kloppen de datums en de inhoud. */}
            {project.hasReinspection && !project.childProjects?.length && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">Hertest</label>
                {(() => {
                  if (!project.dateEnd || !project.reinspectionWeeks) {
                    return (
                      <div className="text-sm text-gray-900">
                        Gepland, datum volgt uit de deadline
                      </div>
                    );
                  }
                  const start = new Date(project.dateEnd);
                  start.setDate(start.getDate() + project.reinspectionWeeks * 7);
                  return (
                    <div className="text-sm text-gray-900">
                      {format(start, 'd MMMM yyyy', { locale: nl })}
                      <span className="text-gray-500">
                        {' '}
                        ({project.reinspectionWeeks} weken na de deadline)
                      </span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Wordt aangemaakt bij het afronden van dit onderzoek.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {planningChanges.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <label className="block text-sm text-gray-500 mb-2">Uitgesteld</label>
                <ul className="space-y-2">
                  {planningChanges.map((c) => (
                    <li key={c.id} className="text-sm text-gray-900">
                      <span className="text-gray-500">
                        {c.oldDateStart ? format(new Date(c.oldDateStart), 'd MMM', { locale: nl }) : '-'}
                        {' → '}
                        {c.newDateStart ? format(new Date(c.newDateStart), 'd MMM yyyy', { locale: nl }) : '-'}
                      </span>
                      {' — '}
                      {c.reason}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(c.createdAt), 'd MMMM yyyy', { locale: nl })}
                        {c.authorName ? ` — ${c.authorName}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Bij een nulmeting horen de afspraken gewoon onderaan; bij een
                vervolgonderzoek staan ze hierboven onder het kopje Nulmeting. */}
            {!project.parentProject && (
              <div className="pt-2 border-t border-gray-200 space-y-3">{planningAfspraken}</div>
            )}
            {/* Transcript van het scopegesprek: de bron voor de scope-afspraken
                hierboven. Hoort bij dit onderzoek, niet bij de nulmeting. */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="scope-transcript" className="block text-sm text-gray-500">
                  Transcript scopegesprek
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript(project.scopeCallTranscript || '');
                    setShowTranscriptModal(true);
                  }}
                  className="text-sm text-shift2-primary hover:underline"
                >
                  {project.scopeCallTranscript ? 'Bewerken' : 'Toevoegen'}
                </button>
              </div>
              {project.scopeCallTranscript ? (
                <details>
                  <summary className="text-sm text-gray-900 cursor-pointer">
                    {project.scopeCallTranscript.trim().split(/\s+/).length} woorden
                  </summary>
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
                    {project.scopeCallTranscript}
                  </div>
                </details>
              ) : (
                <div className="text-sm text-gray-900">-</div>
              )}
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
                          {relatedProject.kenmerk || `SHP-${relatedProject.version}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                          {relatedProject.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{relatedProject.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{Number(relatedProject.version).toFixed(1)}</td>
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

        {/* Column 2: Voorbereiding + Statistieken + Bijlagen */}
        <div className="space-y-6">
          {/* Het routekaartje hoort bij de voorbereiding. Zodra de planning
              akkoord is of het onderzoek loopt, is het niet meer nuttig en
              zou het alleen maar onafgevinkte stappen tonen van iets wat al
              lang achter de rug is. */}
          {!project.planningApproved &&
            projectStatus !== 'Gereed' &&
            projectStatus !== 'Geannuleerd' && (
              <VoorbereidingStappen project={project} />
            )}
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

      {/* Edit Planning Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Transcript scopegesprek</h2>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Sluiten"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleTranscriptSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 flex-1 min-h-0 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-3">
                  Plak hier het transcript van het Teams-gesprek. Daaruit volgen de
                  afspraken over de scope en de pagina&apos;s die de klant wil laten
                  meenemen.
                </p>
                <textarea
                  id="scope-transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={16}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="Plak het transcript..."
                />
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowTranscriptModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSavingTranscript}
                  className="px-4 py-2 text-sm bg-shift2-primary text-white rounded-lg hover:bg-shift2-accent disabled:opacity-50"
                >
                  {isSavingTranscript ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPostponeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Planning uitstellen</h2>
              <button
                onClick={() => setShowPostponeModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Sluiten"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handlePostponeSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Startdatum, deadline en rapportdatum schuiven allemaal even ver op,
                  zodat de looptijd gelijk blijft.
                </p>
                <div>
                  <label htmlFor="postpone-weeks" className="block text-sm text-gray-700 mb-1">
                    Aantal weken
                  </label>
                  <input
                    id="postpone-weeks"
                    type="number"
                    min={1}
                    value={postponeWeeks}
                    onChange={(e) => setPostponeWeeks(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="postpone-reason" className="block text-sm text-gray-700 mb-1">
                    Reden
                  </label>
                  <textarea
                    id="postpone-reason"
                    value={postponeReason}
                    onChange={(e) => setPostponeReason(e.target.value)}
                    rows={3}
                    placeholder="Bijvoorbeeld: klant is nog niet klaar met het herstel."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPostponeModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isPostponing}
                  className="px-4 py-2 text-sm bg-shift2-primary text-white rounded-lg hover:bg-shift2-accent disabled:opacity-50"
                >
                  {isPostponing ? 'Bezig...' : 'Uitstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPlanningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Planning datums bewerken</h2>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handlePlanningSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pl-start" className="block text-sm font-medium text-gray-700 mb-1">
                    Startdatum
                  </label>
                  <input
                    id="pl-start"
                    type="date"
                    value={planningFormData.dateStart}
                    onChange={(e) => zetStartdatum(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="pl-eind" className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    id="pl-eind"
                    type="date"
                    value={planningFormData.dateEnd}
                    onChange={(e) =>
                      setPlanningFormData({ ...planningFormData, dateEnd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Standaard twee weken na de start.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soort onderzoek
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input
                      type="radio"
                      name="soort"
                      checked={!planningFormData.hasReinspection}
                      onChange={() =>
                        setPlanningFormData({ ...planningFormData, hasReinspection: false })
                      }
                    />
                    Nulmeting
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-900">
                    <input
                      type="radio"
                      name="soort"
                      checked={planningFormData.hasReinspection}
                      onChange={() =>
                        setPlanningFormData({ ...planningFormData, hasReinspection: true })
                      }
                    />
                    Nulmeting met hertest
                  </label>
                </div>
                {planningFormData.hasReinspection && (
                  <div className="mt-3 pl-6">
                    <label htmlFor="pl-weken" className="block text-sm text-gray-700 mb-1">
                      Weken tot de hertest
                    </label>
                    <input
                      id="pl-weken"
                      type="number"
                      min={1}
                      value={planningFormData.reinspectionWeeks}
                      onChange={(e) =>
                        setPlanningFormData({ ...planningFormData, reinspectionWeeks: e.target.value })
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    {herinspectieStart && (
                      <p className="text-xs text-gray-500 mt-1">
                        Hertest start op{' '}
                        {format(new Date(`${herinspectieStart}T00:00:00`), 'd MMMM yyyy', { locale: nl })}
                        , en duurt een week.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planning verstuurd
                </label>
                <input
                  type="date"
                  value={planningFormData.planningSent}
                  onChange={(e) => setPlanningFormData({ ...planningFormData, planningSent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planning akkoord
                </label>
                <input
                  type="date"
                  value={planningFormData.planningApproved}
                  onChange={(e) => setPlanningFormData({ ...planningFormData, planningApproved: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Inhoud planningsmail</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Deze velden worden onder de openingsregel in de planningsmail opgenomen. Een leeg veld wordt overgeslagen.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  In scope
                </label>
                <textarea
                  rows={4}
                  {...bulletVeld(planningFormData.scopeInScope, (v) =>
                    setPlanningFormData({ ...planningFormData, scopeInScope: v })
                  )}
                  placeholder={'- Hoofdwebsite heuvelrug.nl\n- Formulieren onder /formulieren/'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buiten scope
                </label>
                <textarea
                  rows={4}
                  {...bulletVeld(planningFormData.scopeOutOfScope, (v) =>
                    setPlanningFormData({ ...planningFormData, scopeOutOfScope: v })
                  )}
                  placeholder={'- Subsite raad.heuvelrug.nl\n- PDF-documenten ouder dan 2024'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Door klant aangedragen pagina's
                </label>
                <textarea
                  rows={4}
                  {...bulletVeld(planningFormData.sampleClientPages, (v) =>
                    setPlanningFormData({ ...planningFormData, sampleClientPages: v })
                  )}
                  placeholder={'- /contact\n- /producten/aanvragen'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-shift2-primary focus:border-shift2-primary font-mono text-sm"
                />
              </div>

              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setShowPlanningModal(false)}
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
    </div>
  );
}
