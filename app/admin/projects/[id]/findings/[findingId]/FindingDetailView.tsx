'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import FindingDialog from '../../tabs/FindingDialog';
import FindingNotesSection from './FindingNotesSection';

interface FindingDetailViewProps {
  project: any;
  finding: any;
  allCriteria: any[];
}

export default function FindingDetailView({ project, finding, allCriteria }: FindingDetailViewProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showBeheerMenu, setShowBeheerMenu] = useState(false);
  const [showBevindingenMenu, setShowBevindingenMenu] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showFindingMenu, setShowFindingMenu] = useState(false);
  const [showFindingDialog, setShowFindingDialog] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);

  // Close menus on Escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBeheerMenu(false);
        setShowBevindingenMenu(false);
        setShowUploadDialog(false);
        setShowFindingMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showBeheerMenu && !target.closest('.beheer-button') && !target.closest('.beheer-menu')) {
        setShowBeheerMenu(false);
      }
      if (showBevindingenMenu && !target.closest('.bevindingen-button') && !target.closest('.bevindingen-menu')) {
        setShowBevindingenMenu(false);
      }
      if (showFindingMenu && !target.closest('.finding-menu-button') && !target.closest('.finding-context-menu')) {
        setShowFindingMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBeheerMenu, showBevindingenMenu, showFindingMenu]);

  // Configure marked to add target="_blank" to all links
  const configureMarked = useCallback(() => {
    const renderer = new marked.Renderer();
    const originalLink = renderer.link.bind(renderer);

    renderer.link = (href: string, title: string | null | undefined, text: string) => {
      const html = originalLink(href, title, text);
      return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" title="opent in nieuw venster" ');
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true
    });
  }, []);

  // Configure marked on component mount
  useEffect(() => {
    configureMarked();
  }, [configureMarked]);

  // Function to render advice with proper markdown formatting
  const renderAdvice = useCallback((advice: string) => {
    try {
      const html = marked(advice);
      return <div className="krafters-markdown-preview finding-description space-y-3" dangerouslySetInnerHTML={{ __html: html as string }} />;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return <div className="text-sm text-gray-700">{advice}</div>;
    }
  }, []);

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    // TODO: Implement note saving API
    setTimeout(() => {
      setIsSavingNote(false);
    }, 500);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      console.log('Starting upload...', uploadFile.name);

      // Upload file to server
      const formData = new FormData();
      formData.append('files', uploadFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload data:', uploadData);
      const uploadedFile = uploadData.files[0];

      // Parse existing evidence or create new array
      let evidenceArray = [];
      if (finding.evidence) {
        try {
          evidenceArray = JSON.parse(finding.evidence);
          console.log('Existing evidence:', evidenceArray);
        } catch (e) {
          console.log('No existing evidence or parse error');
          evidenceArray = [];
        }
      }

      // Add new file to evidence array
      const newEvidence = {
        url: uploadedFile.url,
        filename: uploadedFile.filename,
        caption: uploadCaption,
        type: uploadedFile.type,
        size: uploadedFile.size,
      };
      evidenceArray.push(newEvidence);
      console.log('New evidence array:', evidenceArray);

      // Update finding with new evidence
      const updatePayload = {
        criterionId: finding.wcagCriterionId,
        status: finding.status,
        description: finding.description,
        advice: finding.advice,
        evidence: JSON.stringify(evidenceArray),
        impact: finding.impact,
        responsibility: finding.responsibility,
      };
      console.log('Update payload:', updatePayload);

      const updateResponse = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('Update response status:', updateResponse.status);

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Update failed:', errorText);
        throw new Error('Failed to update finding');
      }

      const updateResult = await updateResponse.json();
      console.log('Update result:', updateResult);

      // Close dialog and refresh page
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadCaption('');

      console.log('Refreshing page...');
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Er is een fout opgetreden bij het uploaden van het bestand.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (indexToDelete: number) => {
    if (!confirm('Weet je zeker dat je deze bijlage wilt verwijderen?')) {
      return;
    }

    try {
      // Parse existing evidence
      let evidenceArray = [];
      if (finding.evidence) {
        try {
          evidenceArray = JSON.parse(finding.evidence);
        } catch (e) {
          evidenceArray = [];
        }
      }

      // Remove the item at the specified index
      evidenceArray.splice(indexToDelete, 1);

      // Update finding with new evidence array
      const updateResponse = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criterionId: finding.wcagCriterionId,
          status: finding.status,
          description: finding.description,
          advice: finding.advice,
          evidence: JSON.stringify(evidenceArray),
          impact: finding.impact,
          responsibility: finding.responsibility,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to delete attachment');
      }

      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de bijlage.');
    }
  };

  const handleOpenEditDialog = (index: number, currentCaption: string, item: any) => {
    setEditingIndex(index);
    setEditCaption(currentCaption || '');
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;

    try {
      // Parse existing evidence
      let evidenceArray = [];
      if (finding.evidence) {
        try {
          evidenceArray = JSON.parse(finding.evidence);
        } catch (e) {
          evidenceArray = [];
        }
      }

      // Update the caption of the item at the editing index
      if (evidenceArray[editingIndex]) {
        evidenceArray[editingIndex].caption = editCaption;
      }

      // Update finding with modified evidence array
      const updateResponse = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criterionId: finding.wcagCriterionId,
          status: finding.status,
          description: finding.description,
          advice: finding.advice,
          evidence: JSON.stringify(evidenceArray),
          impact: finding.impact,
          responsibility: finding.responsibility,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update attachment');
      }

      // Close dialog and refresh page
      setShowEditDialog(false);
      setEditingIndex(null);
      setEditCaption('');
      window.location.reload();
    } catch (error) {
      console.error('Edit error:', error);
      alert('Er is een fout opgetreden bij het bewerken van de bijlage.');
    }
  };

  const handleSaveFinding = async (findingData: any, findingId?: string) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(findingData),
      });

      if (!response.ok) {
        throw new Error('Failed to save finding');
      }

      // Refresh page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Save finding error:', error);
      alert('Er is een fout opgetreden bij het opslaan van de bevinding.');
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col">
      {/* Header with logo and navigation */}
      <header className="border-b border-gray-200" style={{ backgroundColor: '#290047' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <img
                src="/shift2-logo.svg"
                alt="Shift2 Logo"
                className="h-8 w-auto"
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
              <div className="relative">
                <button
                  onClick={() => setShowBevindingenMenu(!showBevindingenMenu)}
                  className="bevindingen-button flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Bevindingen
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Bevindingen Dropdown Menu */}
                {showBevindingenMenu && (
                  <div className="bevindingen-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/bevindingen-zoeken"
                      onClick={() => setShowBevindingenMenu(false)}
                      className="bevindingen-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Bevindingen zoeken
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/snelle-bevindingen"
                      onClick={() => setShowBevindingenMenu(false)}
                      className="bevindingen-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Snelle bevindingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
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

                {/* Beheer Dropdown Menu */}
                {showBeheerMenu && (
                  <div className="beheer-menu absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/onderzoekstypen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Onderzoekstypen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/projecten"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Projecten
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/opdrachtgevers"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Opdrachtgevers
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/crawler-tests"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Crawler tests
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/beoordelingen"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Beoordelingen
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    <Link
                      href="/admin/team"
                      onClick={() => setShowBeheerMenu(false)}
                      className="beheer-menu-item flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                      style={{ transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F0F0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
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

      {/* Title section with tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-6 bg-white">
          {/* Tabs */}
          <nav className="flex gap-8 border-b border-gray-200 items-center mb-4">
            <Link
              href={`/admin/projects/${project.id}`}
              className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
            >
              Details
            </Link>
            <Link
              href={`/admin/projects/${project.id}?tab=scope`}
              className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
            >
              1. Scope
            </Link>
            <Link
              href={`/admin/projects/${project.id}?tab=steekproef`}
              className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
            >
              2. Steekproef
            </Link>
            <Link
              href={`/admin/projects/${project.id}?tab=bevindingen`}
              className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
            >
              3. Bevindingen
            </Link>
            <Link
              href={`/admin/projects/${project.id}?tab=conclusie`}
              className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
            >
              4. Conclusie
            </Link>
            <Link
              href={`/admin/projects/${project.id}?tab=voltooien`}
              className="pt-2 pb-6 px-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors rounded-t-lg"
            >
              5. Voltooien
            </Link>
            <Link
              href={`/report/${project.id}`}
              target="_blank"
              className="ml-auto px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#6b2d8f', marginBottom: '8px' }}
            >
              Bekijk het rapport
            </Link>
          </nav>

          {/* Project title with badges */}
          <div className="flex items-center gap-3 mt-2">
            <Link
              href={`/admin/projects/${project.id}?tab=bevindingen`}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {project.kenmerk && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                {project.kenmerk}
              </span>
            )}
            <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Content */}
          <div className="col-span-8 space-y-6">
            {/* Combined Bevinding, Advies, and Afbeelding Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Bevinding Section */}
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3 relative">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h2
                    className="text-lg text-gray-900"
                    style={{ fontWeight: 900, textShadow: '0 0 0.5px currentColor' }}
                  >
                    Bevinding {finding.findingCode}
                  </h2>
                  <button
                    onClick={() => setShowFindingMenu(!showFindingMenu)}
                    className="finding-menu-button ml-auto text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showFindingMenu && (
                    <div className="finding-context-menu absolute right-0 top-10 z-50 w-56 rounded-lg shadow-lg border border-gray-200 py-1 bg-white">
                      <button
                        onClick={() => {
                          setShowFindingMenu(false);
                          setShowFindingDialog(true);
                        }}
                        className="project-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Bewerken
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Weet je zeker dat je deze bevinding wilt verwijderen?')) {
                            const response = await fetch(`/api/projects/${project.id}/findings/${finding.id}`, {
                              method: 'DELETE',
                            });
                            if (response.ok) {
                              // Redirect to bevindingen tab
                              window.location.href = `/admin/projects/${project.id}?tab=bevindingen`;
                            } else {
                              alert('Er is een fout opgetreden bij het verwijderen van de bevinding.');
                            }
                          }
                          setShowFindingMenu(false);
                        }}
                        className="project-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3 hover:bg-gray-50"
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

              <div className="px-6 py-4">
                {/* Description */}
                <div className="text-sm text-gray-700 leading-relaxed finding-description">
                  {renderAdvice(finding.description)}
                </div>
              </div>

              {/* Advies Section */}
              <div className="px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Advies</h3>
                {renderAdvice(finding.advice || 'Geen advies beschikbaar.')}
              </div>

              {/* Afbeelding Section */}
              {finding.evidence && (() => {
                try {
                  const evidenceData = JSON.parse(finding.evidence);
                  if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                    return (
                      <div className="px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">Afbeeldingen</h3>
                        <div className="space-y-3">
                          {evidenceData.map((item: any, index: number) => (
                            <div key={index} className="relative">
                              <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
                                {item.type?.startsWith('image/') ? (
                                  <div
                                    className="relative cursor-pointer group"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setLightboxImage({ url: item.url, caption: item.caption || item.filename });
                                    }}
                                  >
                                    <img
                                      src={item.url}
                                      alt={item.caption || item.filename}
                                      className="max-w-xs max-h-48 object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                        <span className="text-sm font-medium">Open grotere weergave</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 p-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                      {item.filename}
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-600 flex-1">{item.caption || 'Screenshot'}</p>
                                <button
                                  onClick={() => handleDeleteAttachment(index)}
                                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
                                  title="Verwijderen"
                                >
                                  Verwijderen
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  return null;
                }
                return null;
              })()}
            </div>

            {/* Steekproef Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="text-base font-semibold text-gray-900">Steekproef</h3>
              </div>
              <div className="px-6 py-4">
                {finding.occurrences && finding.occurrences.length > 0 ? (
                  <div className="space-y-2">
                    {finding.occurrences.map((occurrence: any) => (
                      <div key={occurrence.id} className="text-sm text-gray-700">
                        {occurrence.sampleItem?.url || occurrence.sampleItem?.title || 'Geen pagina gespecificeerd'}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Geen pagina's.</p>
                )}
              </div>
            </div>

            {/* Notities Section */}
            <FindingNotesSection
              projectId={project.id}
              findingId={finding.id}
              initialNotes={finding.notes}
            />
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4">
            {/* Single unified card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* WCAG Criterion Section */}
              <div className="px-4 pt-3 pb-1 bg-white">
                <h3 className="text-base font-medium text-gray-900">
                  WCAG {finding.wcagCriterion?.code} {finding.wcagCriterion?.titleNl}
                </h3>
              </div>
              <div className="px-4 pt-1 pb-3 text-sm text-gray-700 leading-relaxed border-b border-gray-200">
                {finding.wcagCriterion?.descriptionNl || 'Geef informatieve afbeeldingen en andere niet-tekstuele content een goed tekstalternatief.'}
              </div>

              {/* Bevinding Details Section */}
              <div className="px-4 py-3">
                <h3 className="text-base font-semibold text-gray-900">Bevinding</h3>
              </div>
              <dl className="px-4 py-3 border-b border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-xs font-medium text-gray-600">Status</dt>
                  <dd>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      finding.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {finding.status === 'open' ? 'Afgekeurd' : 'Opmerking'}
                    </span>
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-xs font-medium text-gray-600">Impact</dt>
                  <dd>
                    {finding.impact && finding.impact !== 'onbekend' ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border"
                        style={{
                          borderColor: finding.impact === 'klein' ? '#d1d5db' :
                                      finding.impact === 'matig' ? '#d4a574' :
                                      finding.impact === 'serieus' ? '#ffa64d' :
                                      '#ffb3b3',
                          color: finding.impact === 'klein' ? '#000000' :
                                 finding.impact === 'matig' ? '#8b4513' :
                                 finding.impact === 'serieus' ? '#994d00' :
                                 '#bb2525'
                        }}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          style={{
                            color: finding.impact === 'klein' ? '#000000' :
                                   finding.impact === 'matig' ? '#8b4513' :
                                   finding.impact === 'serieus' ? '#994d00' :
                                   '#bb2525'
                          }}
                        >
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        {finding.impact.charAt(0).toUpperCase() + finding.impact.slice(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-900">-</span>
                    )}
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-xs font-medium text-gray-600">Verantwoordelijkheid</dt>
                  <dd>
                    {finding.responsibility && finding.responsibility !== 'onbekend' ? (
                      <span
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border bg-white"
                        style={{
                          borderColor: '#d1d5db',
                          color: '#000000'
                        }}
                      >
                        {finding.responsibility}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-900">-</span>
                    )}
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-xs font-medium text-gray-600">Datum aangemaakt</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(finding.createdAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-xs font-medium text-gray-600">Laatst gewijzigd</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(finding.updatedAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>

                {project.researcherName && (
                  <div className="grid grid-cols-2 gap-4">
                    <dt className="text-xs font-medium text-gray-600">Aangemaakt door</dt>
                    <dd className="text-sm text-gray-900">{project.researcherName}</dd>
                  </div>
                )}

                {project.researcherName && (
                  <div className="grid grid-cols-2 gap-4">
                    <dt className="text-xs font-medium text-gray-600">Gewijzigd door</dt>
                    <dd className="text-sm text-gray-900">{project.researcherName}</dd>
                  </div>
                )}
              </dl>

              {/* Bijlagen Section */}
              <div className="px-4 py-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Bijlagen</h3>
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-900 rounded-md border border-green-500 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  Upload bestand
                </button>
              </div>
              <div className="px-4 py-3">
                {finding.evidence && (() => {
                  try {
                    const evidenceData = JSON.parse(finding.evidence);
                    if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                      return (
                        <div className="space-y-2">
                          {evidenceData.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 truncate">
                                  {item.caption || item.filename || `Bestand ${index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(finding.createdAt).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => window.open(item.url, '_blank')}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Open"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleOpenEditDialog(index, item.caption, item)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteAttachment(index)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch (e) {
                    return <p className="text-sm text-gray-500">Geen bijlagen</p>;
                  }
                  return <p className="text-sm text-gray-500">Geen bijlagen</p>;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upload bestand</h2>
              <button
                onClick={() => setShowUploadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bestand (max. 20 MB)
                </label>
                {uploadFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadFile.type.startsWith('image/') ? (
                      <div className="mb-3">
                        <img
                          src={URL.createObjectURL(uploadFile)}
                          alt="Preview"
                          className="w-full h-auto rounded"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{uploadFile.name}</p>
                          <p className="text-xs text-gray-500">
                            ({Math.round(uploadFile.size / 1024)} KB)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Verwijderen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Klik om een bestand te selecteren</p>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                    }
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Omschrijving of tekstalternatief
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Voeg een omschrijving toe..."
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className="modal-save-button w-full px-4 py-3 rounded-md text-white text-base font-semibold"
                style={{
                  backgroundColor: (!uploadFile || isUploading) ? '#9CA3AF' : '#7C3AED'
                }}
              >
                {isUploading ? 'Uploaden...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bijlage bewerken</h2>
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingIndex(null);
                  setEditCaption('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Show the image if it's an image file */}
              {editingItem && editingItem.type?.startsWith('image/') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Afbeelding
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={editingItem.url}
                      alt={editingItem.caption || editingItem.filename}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Omschrijving of tekstalternatief
                </label>
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Voeg een omschrijving toe..."
                />
              </div>

              <button
                onClick={handleSaveEdit}
                className="modal-save-button w-full px-4 py-3 rounded-md text-white text-base font-semibold"
                style={{
                  backgroundColor: '#7C3AED'
                }}
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finding Dialog */}
      <FindingDialog
        isOpen={showFindingDialog}
        onClose={() => setShowFindingDialog(false)}
        onSave={handleSaveFinding}
        criterionId={finding.wcagCriterionId}
        criterionCode={finding.wcagCriterion?.code || ''}
        allCriteria={allCriteria}
        editingFinding={finding}
      />

      {/* Lightbox Dialog */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
          style={{ zIndex: 9999 }}
        >
          <div className="relative flex flex-col items-center max-w-7xl max-h-full gap-4">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Screenshot'}
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxImage.caption && (
              <div className="text-white text-center px-4">
                {lightboxImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}