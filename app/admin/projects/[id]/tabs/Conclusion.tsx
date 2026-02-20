'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'md-editor-rt/lib/style.css';
import TurndownService from 'turndown';
import { marked } from 'marked';

// Configure marked to preserve line breaks
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true,    // GitHub Flavored Markdown
});

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

const AVAILABLE_TECHNOLOGIES = ['DOM', 'HTML', 'CSS', 'JavaScript', 'WAI-ARIA', 'SVG', 'PDF'];

const FIXED_INTRO_TEXT = 'Tijdens het onderzoek is opgevallen dat de website al een goede basis legt voor toegankelijke content. Tegelijk zijn er enkele verbeterpunten die nog aandacht verdienen.';

export default function Conclusion({ project }: { project: any }) {
  const router = useRouter();
  const [managementSummary, setManagementSummary] = useState(project.managementSummary || '');
  const [researcherFeedback, setResearcherFeedback] = useState(project.researcherFeedback || '');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Migrate old array format to HTML string format
  const initialUserAgents = Array.isArray(project.userAgents)
    ? `<p>${project.userAgents.filter((a: string) => a.trim()).join('</p><p>')}</p>`
    : (project.userAgents || '');

  const [userAgents, setUserAgents] = useState(initialUserAgents);
  const [technologies, setTechnologies] = useState(project.technologies || ['DOM', 'HTML', 'CSS']);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState<'summary' | 'feedback' | 'userAgents' | 'technologies' | null>(null);
  const [tempContent, setTempContent] = useState('');
  const [tempTechnologies, setTempTechnologies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal && !isSaving) {
        closeEditModal();
      }
    };

    if (showEditModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEditModal, isSaving]);

  const openEditModal = (mode: 'summary' | 'feedback' | 'userAgents' | 'technologies') => {
    setEditMode(mode);
    const turndownService = new TurndownService({
      br: '\n', // Convert <br> tags to newlines
    });

    if (mode === 'summary') {
      // Convert HTML to Markdown for editing
      const markdown = turndownService.turndown(managementSummary || '');
      setTempContent(markdown);
    } else if (mode === 'feedback') {
      // Convert HTML to Markdown for editing
      const markdown = turndownService.turndown(researcherFeedback || '');
      setTempContent(markdown);
    } else if (mode === 'userAgents') {
      // Convert HTML to Markdown for editing
      const markdown = turndownService.turndown(userAgents || '');
      setTempContent(markdown);
    } else if (mode === 'technologies') {
      setTempTechnologies(technologies);
    }
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditMode(null);
    setTempContent('');
    setTempTechnologies([]);
  };

  const saveContent = async () => {
    setIsSaving(true);
    try {
      let updateData: any = {};

      if (editMode === 'summary') {
        // Convert Markdown to HTML for storage
        const html = await marked.parse(tempContent);
        updateData.managementSummary = html;
      } else if (editMode === 'feedback') {
        // Convert Markdown to HTML for storage
        const html = await marked.parse(tempContent);
        updateData.researcherFeedback = html;
      } else if (editMode === 'userAgents') {
        // Convert Markdown to HTML for storage
        const html = await marked.parse(tempContent);
        updateData.userAgents = html;
      } else if (editMode === 'technologies') {
        updateData.technologies = tempTechnologies;
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        if (editMode === 'summary') {
          // Store the HTML version in state
          const html = await marked.parse(tempContent);
          setManagementSummary(html);
        } else if (editMode === 'feedback') {
          // Store the HTML version in state
          const html = await marked.parse(tempContent);
          setResearcherFeedback(html);
        } else if (editMode === 'userAgents') {
          // Store the HTML version in state
          const html = await marked.parse(tempContent);
          setUserAgents(html);
        } else if (editMode === 'technologies') {
          setTechnologies(tempTechnologies);
        }
        router.refresh();
        closeEditModal();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert('Er ging iets mis bij het opslaan.');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Er ging iets mis bij het opslaan.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTechnology = (tech: string) => {
    setTempTechnologies(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const generateAIFeedback = async () => {
    setIsGeneratingFeedback(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/generate-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const feedbackHtml = `<p>${FIXED_INTRO_TEXT}</p>\n\n${data.aiSummary}`;
        setResearcherFeedback(feedbackHtml);

        // Save to database
        await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researcherFeedback: feedbackHtml }),
        });

        router.refresh();
      } else {
        const errorData = await response.json();
        console.error('Error generating feedback:', errorData);
        alert('Er ging iets mis bij het genereren van de feedback: ' + (errorData.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      alert('Er ging iets mis bij het genereren van de feedback.');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const generateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/generate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setManagementSummary(data.aiSummary);

        // Save to database
        await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ managementSummary: data.aiSummary }),
        });

        router.refresh();
      } else {
        const errorData = await response.json();
        console.error('Error generating summary:', errorData);
        alert('Er ging iets mis bij het genereren van de samenvatting: ' + (errorData.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Er ging iets mis bij het genereren van de samenvatting.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left column - Main content */}
        <div className="col-span-9 space-y-6">
          {/* Feedback van onderzoeker */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Feedback van onderzoeker</h2>
              <div className="flex gap-2">
                <button
                  onClick={generateAIFeedback}
                  disabled={isGeneratingFeedback}
                  className="new-project-button findings-button flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-blue-500 bg-white hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {isGeneratingFeedback ? 'Genereren...' : 'Genereer met AI'}
                </button>
                <button
                  onClick={() => openEditModal('feedback')}
                  className="new-project-button findings-button flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-green-500 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Bewerken
                </button>
              </div>
            </div>
            {researcherFeedback ? (
              <div
                className="prose prose-sm max-w-none text-gray-700 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                dangerouslySetInnerHTML={{ __html: researcherFeedback }}
              />
            ) : (
              <div className="space-y-3">
                <div className="text-gray-500 text-sm">
                  Nog geen feedback toegevoegd. Klik op 'Genereer met AI' om automatisch een samenvatting te genereren op basis van de bevindingen, of klik op 'Bewerken' om handmatig feedback toe te voegen.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Stap 4. Conclusie */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-6 text-shift2-primary">Stap 4. Conclusie</h3>

            <p className="text-sm text-gray-600 mb-6">
              Geef een korte samenvatting van de bevindingen. Beschrijf de belangrijkste observaties, zoals veelvoorkomende problemen en patronen.
            </p>

            {/* User agents */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">User agents</h4>
                <button
                  onClick={() => openEditModal('userAgents')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              {userAgents ? (
                <div
                  className="prose prose-sm max-w-none text-sm text-gray-700 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                  dangerouslySetInnerHTML={{ __html: userAgents }}
                />
              ) : (
                <div className="text-gray-500 text-sm italic">
                  Nog geen user agents toegevoegd. Klik op 'Bewerken' om user agents toe te voegen.
                </div>
              )}
            </div>

            {/* Technologieën */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Technologieën</h4>
                <button
                  onClick={() => openEditModal('technologies')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                {technologies.map((tech: string, index: number) => (
                  <li key={index}>• {tech}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editMode === 'summary' && 'Samenvatting bewerken'}
                {editMode === 'feedback' && 'Feedback van onderzoeker bewerken'}
                {editMode === 'userAgents' && 'User agents bewerken'}
                {editMode === 'technologies' && 'Technologieën bewerken'}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {editMode === 'technologies' ? (
                <div className="space-y-3">
                  {AVAILABLE_TECHNOLOGIES.map((tech) => (
                    <label key={tech} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempTechnologies.includes(tech)}
                        onChange={() => toggleTechnology(tech)}
                        className="w-5 h-5 text-shift2-primary border-gray-300 rounded focus:ring-shift2-primary"
                      />
                      <span className="text-sm text-gray-700">{tech}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <MdEditor
                  modelValue={tempContent}
                  onChange={setTempContent}
                  language="en-US"
                  theme="light"
                  previewTheme="default"
                  codeTheme="github"
                  showCodeRowNumber={true}
                  toolbars={[
                    'bold',
                    'underline',
                    'italic',
                    '-',
                    'title',
                    'strikeThrough',
                    'sub',
                    'sup',
                    'quote',
                    'unorderedList',
                    'orderedList',
                    '-',
                    'codeRow',
                    'code',
                    'link',
                    'image',
                    'table',
                    '-',
                    'revoke',
                    'next',
                    '=',
                    'pageFullscreen',
                    'fullscreen',
                    'preview',
                    'catalog',
                  ]}
                  style={{ height: '400px' }}
                />
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={saveContent}
                className="modal-save-button px-4 py-2 text-white rounded-lg transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isSaving}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}