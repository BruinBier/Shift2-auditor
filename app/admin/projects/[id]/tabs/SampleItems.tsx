'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { marked } from 'marked';
import 'md-editor-rt/lib/style.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSampleRow } from './SortableSampleRow';

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

export default function SampleItems({ project }: { project: any }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<'structured' | 'random' | 'pdf'>('structured');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [editorsReady, setEditorsReady] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    sampleType: 'structured' as 'structured' | 'random' | 'pdf',
    makeScreenshot: false,
  });
  const [sampleInfo, setSampleInfo] = useState(project.sampleInfo || '');
  const [showSampleInfoModal, setShowSampleInfoModal] = useState(false);
  const [tempSampleInfo, setTempSampleInfo] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [debugMode, setDebugMode] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [availableTests, setAvailableTests] = useState<string[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort items by orderIndex, then by createdAt
  const items = [...project.sampleItems].sort((a, b) => {
    if (a.orderIndex !== null && b.orderIndex !== null) {
      return a.orderIndex - b.orderIndex;
    }
    if (a.orderIndex !== null) return -1;
    if (b.orderIndex !== null) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Check if an item has been tested (has crawler results in database)
  const hasBeenTested = (item: any) => {
    return item.crawlerResults && item.crawlerResults.length > 0;
  };

  // Fetch available tests when debug mode is enabled
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/tests/available');
        if (response.ok) {
          const data = await response.json();
          setAvailableTests(data.tests || []);
        }
      } catch (error) {
        console.error('Error fetching available tests:', error);
      }
    };

    if (debugMode && availableTests.length === 0) {
      fetchTests();
    }
  }, [debugMode, availableTests.length]);

  // Reset editor key when modals open to force remount with delay
  useEffect(() => {
    if (showModal || showSampleInfoModal) {
      setEditorsReady(false);
      setEditorKey(Date.now());
      // Delay to ensure DOM is ready before mounting editors
      const timer = setTimeout(() => {
        setEditorsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setEditorsReady(false);
    }
  }, [showModal, showSampleInfoModal]);

  // Close context menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId &&
          !target.closest('.sample-context-menu') &&
          !target.closest('.sample-menu-button')) {
        setOpenMenuId(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenuId) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [openMenuId]);

  // Convert markdown to HTML
  const convertMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    try {
      // Check if the content is already HTML (contains HTML tags)
      if (/<\/?[a-z][\s\S]*>/i.test(markdown)) {
        return markdown;
      }
      // Convert markdown to HTML
      return marked.parse(markdown) as string;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      return markdown;
    }
  };

  // Add title attribute to all links in HTML
  const addTitleToLinks = (html: string) => {
    if (!html) return html;
    return html.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attrs) => {
        if (!/title=/i.test(attrs)) {
          return `<a ${attrs} title="opent in nieuw venster">`;
        }
        return match;
      }
    );
  };

  const openItemModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        title: item.title,
        url: item.url || '',
        description: item.description || '',
        sampleType: item.sampleType || activeType,
        makeScreenshot: item.makeScreenshot || false,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        sampleType: activeType,
        makeScreenshot: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', url: '', description: '', sampleType: activeType, makeScreenshot: false });
  };

  const fetchTitle = async () => {
    if (!formData.url) {
      alert('Vul eerst een URL in');
      return;
    }

    setIsFetchingTitle(true);
    try {
      const response = await fetch('/api/fetch-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title) {
          setFormData({ ...formData, title: data.title });
        } else {
          // Generate fallback title from URL
          const suggestedTitle = generateTitleFromUrl(formData.url);
          if (confirm(`Geen titel gevonden. Wil je deze suggestie gebruiken?\n\n"${suggestedTitle}"\n\nKlik OK om te gebruiken, of Annuleren om handmatig in te vullen.`)) {
            setFormData({ ...formData, title: suggestedTitle });
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || 'Fout bij ophalen van titel';

        // Generate fallback title from URL
        const suggestedTitle = generateTitleFromUrl(formData.url);
        if (confirm(`${errorMsg}\n\nWil je deze suggestie gebruiken?\n\n"${suggestedTitle}"\n\nKlik OK om te gebruiken, of Annuleren om handmatig in te vullen.`)) {
          setFormData({ ...formData, title: suggestedTitle });
        }
      }
    } catch (error) {
      console.error('Error fetching title:', error);

      // Generate fallback title from URL
      const suggestedTitle = generateTitleFromUrl(formData.url);
      if (confirm(`Kon titel niet ophalen.\n\nWil je deze suggestie gebruiken?\n\n"${suggestedTitle}"\n\nKlik OK om te gebruiken, of Annuleren om handmatig in te vullen.`)) {
        setFormData({ ...formData, title: suggestedTitle });
      }
    } finally {
      setIsFetchingTitle(false);
    }
  };

  // Helper function to generate a title from URL
  const generateTitleFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Get the last meaningful part of the path
      const parts = pathname.split('/').filter(p => p && p !== 'form');
      const lastPart = parts[parts.length - 1] || parts[parts.length - 2] || '';

      // Clean up: remove numbers at the end, replace hyphens/underscores with spaces, capitalize
      const cleaned = lastPart
        .replace(/-\d+$/, '') // Remove trailing numbers like "-0"
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return cleaned || 'Formulier';
    } catch {
      return 'Formulier';
    }
  };

  const handleSubmit = async (e: React.FormEvent, andNew: boolean = false) => {
    e.preventDefault();

    if (editingId) {
      // Update existing item
      const response = await fetch(`/api/sample-items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        closeModal();
        router.refresh();
      } else {
        alert('Fout bij bijwerken van item');
      }
    } else {
      // Create new item
      const response = await fetch(`/api/projects/${project.id}/sample-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sampleType: formData.sampleType,
          orderIndex: items.length + 1,
        }),
      });

      if (response.ok) {
        if (andNew) {
          // Reset form but keep modal open
          setFormData({
            title: '',
            url: '',
            description: '',
            sampleType: formData.sampleType,
            makeScreenshot: false,
          });
        } else {
          closeModal();
        }
        router.refresh();
      } else {
        alert('Fout bij toevoegen van item');
      }
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    const response = await fetch(`/api/sample-items/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setOpenMenuId(null);
      router.refresh();
    } else {
      alert('Fout bij verwijderen van item');
    }
  };

  const handleRunTests = async (itemId: string, url: string) => {
    if (!url) {
      alert('Dit item heeft geen URL om te testen');
      return;
    }

    // Validate debug mode requirements
    if (debugMode && !selectedTest) {
      alert('⚠️ Selecteer eerst een test in debug mode');
      return;
    }

    setRunningTests(prev => new Set(prev).add(itemId));
    setOpenMenuId(null);

    try {
      const body = debugMode && selectedTest
        ? { testName: selectedTest, withBrowser: true }
        : { withBrowser: true };

      const response = await fetch(`/api/sample-items/${itemId}/crawler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Mark as completed
        setCompletedTests(prev => new Set(prev).add(itemId));

        const modeText = data.debugMode ? `\n🐛 Debug mode: ${data.testName}` : '';
        alert(`✅ Tests succesvol uitgevoerd!${modeText}\n\n` +
              `Tests gedraaid: ${data.testsRun}\n` +
              `Issues gevonden: ${data.testsFound}\n\n` +
              `De resultaten zijn nu beschikbaar op de detail pagina.`);
        router.refresh();
      } else {
        alert(`❌ Er ging iets mis: ${data.error}`);
      }
    } catch (error) {
      console.error('Error running tests:', error);
      alert('❌ Er ging iets mis bij het draaien van de tests.');
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const openSampleInfoModal = () => {
    setTempSampleInfo(sampleInfo);
    setShowSampleInfoModal(true);
  };

  const closeSampleInfoModal = () => {
    setShowSampleInfoModal(false);
    setTempSampleInfo('');
  };

  const saveSampleInfoModal = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleInfo: tempSampleInfo }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error saving sampleInfo:', error);
        alert('Fout bij opslaan van steekproef informatie');
        return;
      }

      setSampleInfo(tempSampleInfo);
      router.refresh();
      closeSampleInfoModal();
    } catch (error) {
      console.error('Exception while saving sampleInfo:', error);
      alert('Fout bij opslaan van steekproef informatie');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item: any) => item.id === active.id);
    const newIndex = items.findIndex((item: any) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);

    // Update orderIndex for all items
    const updates = newItems.map((item: any, index: number) => ({
      id: item.id,
      orderIndex: index + 1,
    }));

    try {
      const response = await fetch(`/api/projects/${project.id}/sample-items/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Fout bij opslaan van nieuwe volgorde');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Fout bij opslaan van nieuwe volgorde');
    }
  };

  const voorgesteldeItems = project.sampleItems.filter((i: any) => i.voorgesteld);
  const [bezigMetGoedkeuren, setBezigMetGoedkeuren] = useState(false);

  /** Alle voorstellen in één keer accorderen -- de lijst als geheel, niet per pagina. */
  const keurSteekproefGoed = async () => {
    setBezigMetGoedkeuren(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/sample-items/akkoord`, {
        method: 'POST',
      });
      if (!res.ok) {
        const fout = await res.json().catch(() => ({}));
        alert(fout.error || 'Goedkeuren is niet gelukt.');
        return;
      }
      router.refresh();
    } catch {
      alert('Goedkeuren is niet gelukt.');
    } finally {
      setBezigMetGoedkeuren(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        button.sample-add-button,
        button.sample-add-button[class] {
          background-color: white !important;
        }
        button.sample-add-button:hover,
        button.sample-add-button[class]:hover {
          background-color: #F9FAFB !important;
        }
        button.sample-menu-button,
        button.sample-menu-button[class],
        a.sample-link-button,
        a.sample-link-button[class] {
          background-color: transparent !important;
        }
        button.sample-menu-button:hover,
        button.sample-menu-button[class]:hover,
        a.sample-link-button:hover,
        a.sample-link-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        .sample-context-menu,
        div.sample-context-menu[class] {
          background-color: white !important;
        }
        button.sample-menu-item,
        button.sample-menu-item[class] {
          background-color: transparent !important;
        }
        button.sample-menu-item:hover,
        button.sample-menu-item[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-menu-item-delete,
        button.sample-menu-item-delete[class] {
          background-color: transparent !important;
        }
        button.sample-menu-item-delete:hover,
        button.sample-menu-item-delete[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-modal-close,
        button.sample-modal-close[class] {
          background-color: transparent !important;
        }
        button.sample-modal-close:hover,
        button.sample-modal-close[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-info-button,
        button.sample-info-button[class] {
          background-color: transparent !important;
        }
        button.sample-info-button:hover,
        button.sample-info-button[class]:hover {
          background-color: #F3F4F6 !important;
        }
        button.sample-tab-button.active,
        button.sample-tab-button.active[class] {
          background-color: transparent !important;
        }
        button.sample-tab-button,
        button.sample-tab-button[class] {
          background-color: transparent !important;
        }
        .prose ul,
        .prose ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .prose ul {
          list-style-type: disc;
        }
        .prose ol {
          list-style-type: decimal;
        }
        .prose li {
          margin: 0.25rem 0;
        }
        .prose li p {
          margin: 0;
        }
        .prose a,
        .prose a.external-link {
          color: #6b2d8f !important;
          text-decoration: underline !important;
          transition: opacity 0.2s ease;
        }
        .prose a:hover,
        .prose a.external-link:hover {
          opacity: 0.7;
        }
        .prose a::after,
        .prose a.external-link::after {
          content: '';
          display: inline-block;
          width: 12px;
          height: 12px;
          margin-left: 4px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b2d8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'%3E%3C/path%3E%3Cpolyline points='15 3 21 3 21 9'%3E%3C/polyline%3E%3Cline x1='10' y1='14' x2='21' y2='3'%3E%3C/line%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-size: contain;
          vertical-align: middle;
        }
        /* Table header alignment */
        th.pb-3 {
          padding-top: 12px;
        }
      `}} />

      {/*
        Een steekproef die een agent heeft samengesteld, wacht op één blik van de
        onderzoeker. Niet per pagina zoals bij een bevinding: de vraag is niet
        "klopt deze pagina" maar "dekt deze verzameling de site". Vandaar één knop
        voor de hele lijst.

        Zolang deze melding er staat, weigert `audit-samples` te starten. Zonder
        dat zou de vlag een sticker zijn -- en het geval dat we willen afvangen is
        juist dat er niet gekeken wordt.
      */}
      {voorgesteldeItems.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
            </svg>
            <div>
              <p className="font-medium text-amber-900">
                {voorgesteldeItems.length} van de {project.sampleItems.length} pagina&apos;s {voorgesteldeItems.length === 1 ? 'is' : 'zijn'} voorgesteld en nog niet bekeken
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Loop de lijst na: schrap wat niet past, vul aan wat mist. De audit start pas
                als de steekproef akkoord is.
              </p>
            </div>
          </div>
          <button
            onClick={keurSteekproefGoed}
            disabled={bezigMetGoedkeuren}
            className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
          >
            {bezigMetGoedkeuren ? 'Bezig...' : 'Steekproef akkoord'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column - Sample items list */}
        <div className="col-span-2 space-y-8">
          <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Steekproef ({project.sampleItems.length})</h3>
                <button
                  onClick={() => openItemModal()}
                  className="sample-add-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{
                    border: '1px solid #79e792',
                    color: '#1f0036'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.0" />
                  </svg>
                  Nieuwe pagina
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Nog geen steekproefitems toegevoegd.</p>
              </div>
            ) : (
              <div className="overflow-visible">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map((item: any) => item.id)} strategy={verticalListSortingStrategy}>
                    <table className="w-full table-fixed">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="pb-3 pl-6 pr-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                          <th className="pb-3 pr-4 text-left text-xs font-medium text-gray-500 uppercase w-32">Type</th>
                          <th className="pb-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Pagina</th>
                          <th className="pb-3 pr-6 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                      {items.map((item: any) => (
                        <SortableSampleRow
                          key={item.id}
                          item={item}
                          project={project}
                          runningTests={runningTests}
                          completedTests={completedTests}
                          hasBeenTested={hasBeenTested}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                          openItemModal={openItemModal}
                          handleRunTests={handleRunTests}
                          handleDelete={handleDelete}
                          debugMode={debugMode}
                          setDebugMode={setDebugMode}
                          selectedTest={selectedTest}
                          setSelectedTest={setSelectedTest}
                          availableTests={availableTests}
                        />
                      ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Sample info */}
        <div className="space-y-6">
          {/* Stap 2 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Stap 2. Steekproef</h3>
            <p className="text-sm text-gray-600">
              Selecteer pagina's voor het onderzoek. Zorg dat de selectie representatief is voor de te onderzoeken website of app.
            </p>
          </div>

          {/* Overige steekproef informatie */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overige steekproef informatie</h3>
              <div className="flex gap-2">
                <button
                  onClick={openSampleInfoModal}
                  className="sample-info-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-full min-h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">
              {sampleInfo ? (
                <div
                  className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mb-2 [&_h4]:mt-3 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mb-2 [&_h5]:mt-3 [&_h6]:text-sm [&_h6]:font-bold [&_h6]:mb-2 [&_h6]:mt-3"
                  dangerouslySetInnerHTML={{ __html: addTitleToLinks(convertMarkdownToHtml(sampleInfo)) }}
                />
              ) : (
                <span className="text-gray-400">Vul hier aanvullende steekproef informatie in...</span>
              )}
            </div>
          </div>

          {/* Statistieken */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Statistieken</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gestructureerde steekproef</span>
                <span className="font-medium">{project.sampleItems.filter((i: any) => i.sampleType === 'structured').length} pagina's</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Willekeurige steekproef</span>
                <span className="font-medium">{project.sampleItems.filter((i: any) => i.sampleType === 'random').length} pagina</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PDF steekproef</span>
                <span className="font-medium">{project.sampleItems.filter((i: any) => i.sampleType === 'pdf').length}</span>
              </div>
            </div>

            {/* Percentage berekening */}
            {(() => {
              const totalItems = project.sampleItems.length;
              const randomItems = project.sampleItems.filter((i: any) => i.sampleType === 'random').length;
              const percentage = totalItems > 0 ? Math.round((randomItems / totalItems) * 100) : 0;
              const meetsMinimum = percentage >= 10;

              return totalItems > 0 ? (
                <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${meetsMinimum ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${meetsMinimum ? 'text-green-600' : 'text-yellow-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className={`text-xs ${meetsMinimum ? 'text-green-800' : 'text-yellow-800'}`}>
                    De willekeurige steekproef bevat {percentage}% van de totale steekproef. Dit moet minstens 10% te zijn.
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Nieuwe pagina</h3>
              <button
                onClick={closeModal}
                className="sample-modal-close text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex-1 overflow-auto">
                <div className="space-y-4">
                  {/* Locatie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Locatie
                    </label>
                    <input
                      type="url"
                      required={formData.sampleType !== 'pdf'}
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                      placeholder="https://mijn.hhnk.nl/authenticate"
                    />
                  </div>

                  {/* Titel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                        placeholder="Pre-loginpagina"
                      />
                      <button
                        type="button"
                        onClick={fetchTitle}
                        disabled={isFetchingTitle || !formData.url}
                        className="sample-info-button px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isFetchingTitle ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Ophalen...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Titel ophalen
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Maak schermafbeelding */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.makeScreenshot}
                        onChange={(e) => setFormData({ ...formData, makeScreenshot: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Maak schermafbeelding</span>
                  </div>

                  {/* Beschrijving */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving
                    </label>
                    {editorsReady ? (
                      <MdEditor
                        key={`sample-description-${editorKey}`}
                        modelValue={formData.description}
                        onChange={(content) => setFormData({ ...formData, description: content })}
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
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4 h-[300px] flex items-center justify-center">
                        <span className="text-gray-500">Laden...</span>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Bijvoorbeeld beschrijving van proces of andere details van de pagina.</p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.sampleType}
                      onChange={(e) => setFormData({ ...formData, sampleType: e.target.value as 'structured' | 'random' | 'pdf' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shift2-primary focus:border-transparent"
                    >
                      <option value="structured">Gestructureerde steekproef</option>
                      <option value="random">Willekeurige steekproef</option>
                      <option value="pdf">PDF steekproef</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Buttons - Fixed footer */}
              <div className="p-6 border-t border-gray-200 bg-white flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f' }}
                >
                  Opslaan
                </button>
                {!editingId && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e as any, true)}
                    className="sample-add-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{
                      border: '1px solid #79e792',
                      color: '#1f0036'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1f0036' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Opslaan en nieuw
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sample Info Modal */}
      {showSampleInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Overige steekproef informatie</h3>
              <button
                onClick={closeSampleInfoModal}
                className="sample-modal-close text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving
                </label>
                {editorsReady ? (
                  <MdEditor
                    key={`sample-info-${editorKey}`}
                    modelValue={tempSampleInfo}
                    onChange={setTempSampleInfo}
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
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 h-[300px] flex items-center justify-center">
                    <span className="text-gray-500">Laden...</span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={saveSampleInfoModal}
                  className="w-full px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#6b2d8f' }}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
