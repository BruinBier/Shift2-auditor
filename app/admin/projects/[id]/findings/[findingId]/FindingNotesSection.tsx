'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'md-editor-rt/lib/style.css';

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

interface FindingNotesSectionProps {
  projectId: string;
  findingId: string;
  initialNotes?: string;
}

interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function FindingNotesSection({ projectId, findingId, initialNotes }: FindingNotesSectionProps) {
  const [notes, setNotes] = useState('');
  const [notesList, setNotesList] = useState<Note[]>(() => {
    if (!initialNotes) return [];
    try {
      const parsed = JSON.parse(initialNotes);
      return Array.isArray(parsed) ? parsed : [{ id: '1', content: initialNotes, author: 'Frits Karskens', createdAt: new Date().toISOString() }];
    } catch {
      return [{ id: '1', content: initialNotes, author: 'Frits Karskens', createdAt: new Date().toISOString() }];
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Close menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId &&
          !target.closest('.notes-context-menu') &&
          !target.closest('.notes-menu-button')) {
        setOpenMenuId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showTooltip) {
          setShowTooltip(false);
        } else if (openMenuId) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId || showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [openMenuId, showTooltip]);

  const handleSave = async () => {
    if (!notes.trim()) {
      alert('Voer eerst een notitie in');
      return;
    }

    setIsSaving(true);
    try {
      let updatedNotesList: Note[];

      if (editingNoteId) {
        // Bewerk een bestaande notitie
        updatedNotesList = notesList.map(note =>
          note.id === editingNoteId
            ? { ...note, content: notes }
            : note
        );
        setEditingNoteId(null);
      } else {
        // Voeg een nieuwe notitie toe
        const newNote: Note = {
          id: Date.now().toString(),
          content: notes,
          author: 'Frits Karskens',
          createdAt: new Date().toISOString()
        };
        updatedNotesList = [...notesList, newNote];
      }

      const response = await fetch(`/api/projects/${projectId}/findings/${findingId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: JSON.stringify(updatedNotesList)
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to save notes');
        alert('Er is iets misgegaan bij het opslaan. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Er is iets misgegaan bij het opslaan. Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (noteId: string) => {
    const note = notesList.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setNotes(note.content);
      setOpenMenuId(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Weet je zeker dat je deze notitie wilt verwijderen?')) {
      return;
    }

    setOpenMenuId(null);
    try {
      const updatedNotesList = notesList.filter(note => note.id !== noteId);

      const response = await fetch(`/api/projects/${projectId}/findings/${findingId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: updatedNotesList.length > 0 ? JSON.stringify(updatedNotesList) : null
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to delete notes');
        alert('Er is iets misgegaan bij het verwijderen. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Error deleting notes:', error);
      alert('Er is iets misgegaan bij het verwijderen. Probeer het opnieuw.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'zojuist';
      if (diffMins < 60) return `${diffMins} minuten geleden`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} uur geleden`;

      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'zojuist';
    }
  };

  return (
    <>
      <style jsx global>{`
        .notes-context-menu,
        div.notes-context-menu[class] {
          background-color: white !important;
        }
        button.notes-menu-item,
        button.notes-menu-item[class] {
          background-color: transparent !important;
        }
        button.notes-menu-item:hover,
        button.notes-menu-item[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.notes-menu-item-delete,
        button.notes-menu-item-delete[class] {
          background-color: transparent !important;
        }
        button.notes-menu-item-delete:hover,
        button.notes-menu-item-delete[class]:hover {
          background-color: #F3F4F6 !important;
        }
      `}</style>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-base font-semibold text-gray-900">Notities</h3>
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="ml-auto text-gray-400 hover:text-gray-600"
            title="Help"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </button>
          {showTooltip && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTooltip(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-80 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-4">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45" />
                <div className="relative">
                  <p className="mb-2">
                    Gebruik dit veld om notities toe te voegen aan deze bevinding tijdens het onderzoek.
                  </p>
                  <p>
                    Notities worden opgeslagen per bevinding en zijn alleen zichtbaar voor het auditteam.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4">
          {/* Existing notes list */}
          {notesList.length > 0 && (
            <div className="mb-6 space-y-4">
              {notesList.map((note) => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{note.author}</p>
                      <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                        className="notes-menu-button text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {openMenuId === note.id && (
                        <div className="notes-context-menu absolute right-0 top-8 z-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                          <button
                            onClick={() => handleEdit(note.id)}
                            className="notes-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Bewerken
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="notes-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Verwijderen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-sm text-gray-700 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>
              ))}
            </div>
          )}

          {notesList.length === 0 && (
            <p className="text-sm text-gray-500 italic mb-4">Geen notities.</p>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            {editingNoteId ? 'Notitie bewerken' : 'Nieuwe notitie'}
          </label>

          <MdEditor
            modelValue={notes}
            onChange={(content) => setNotes(content)}
            language="en-US"
            theme="light"
            previewTheme="default"
            codeTheme="github"
            showCodeRowNumber={true}
            toolbars={[
              'bold',
              'italic',
              'strikeThrough',
              '-',
              'title',
              'unorderedList',
              'orderedList',
              '-',
              'quote',
              'code',
              'link',
              'image',
              '-',
              'revoke',
              'next',
              '-',
              'preview',
              'fullscreen'
            ]}
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-200 text-purple-900 rounded-lg text-sm font-medium hover:bg-purple-300 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Opslaan...' : 'Notitie opslaan'}
            </button>
            {editingNoteId && (
              <button
                onClick={() => {
                  setEditingNoteId(null);
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Annuleren
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}