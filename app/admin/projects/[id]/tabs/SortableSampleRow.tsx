'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

interface SortableSampleRowProps {
  item: any;
  project: any;
  runningTests: Set<string>;
  completedTests: Set<string>;
  hasBeenTested: (item: any) => boolean;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  openItemModal: (item: any) => void;
  handleRunTests: (itemId: string, url: string) => void;
  handleDelete: (itemId: string) => void;
  debugMode: boolean;
  setDebugMode: (mode: boolean) => void;
  selectedTest: string;
  setSelectedTest: (test: string) => void;
  availableTests: string[];
  keurGoed: (itemId: string) => void;
  bezigMetGoedkeuren: string | null;
}

export function SortableSampleRow({
  item,
  project,
  runningTests,
  completedTests,
  hasBeenTested,
  openMenuId,
  setOpenMenuId,
  openItemModal,
  handleRunTests,
  handleDelete,
  debugMode,
  setDebugMode,
  selectedTest,
  setSelectedTest,
  availableTests,
  keurGoed,
  bezigMetGoedkeuren,
}: SortableSampleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-50' : ''}
    >
      {/* Drag handle column */}
      <td className="py-4 pl-6 pr-2 align-top w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 p-1"
          title="Sleep om volgorde te wijzigen"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>
      </td>

      {/* Type column */}
      <td className="py-4 pr-4 align-top w-32">
        <span className="text-sm text-gray-600">
          {item.sampleType === 'structured' ? 'structured' : item.sampleType === 'random' ? 'willekeurig' : 'pdf'}
        </span>
        {/*
          Een pagina die een agent voorstelde, wacht op een blik. Pas als je hem
          hebt bekeken vervalt de markering -- en zolang er nog een openstaat,
          weigert `audit-samples` te starten. Bewerken laat de vlag ook vervallen;
          deze knop is voor de pagina's waar niets aan hoeft.
        */}
        {item.voorgesteld && (
          <button
            onClick={() => keurGoed(item.id)}
            disabled={bezigMetGoedkeuren === item.id}
            className="mt-2 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-medium hover:bg-amber-200 disabled:opacity-50"
            title="Deze pagina is voorgesteld door een agent. Klik als hij klopt."
          >
            {bezigMetGoedkeuren === item.id ? (
              'Bezig...'
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Akkoord
              </>
            )}
          </button>
        )}
      </td>

      {/* Content column */}
      <td className="py-4 px-4 align-top">
        <div>
          {project.researchTypeData?.type === 'formulieren' ? (
            <>
              <div className="font-medium text-gray-900 mb-1">{item.title}</div>
              <div className="flex items-center gap-2 mb-1">
                {runningTests.has(item.id) && (
                  <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {!runningTests.has(item.id) && (hasBeenTested(item) || completedTests.has(item.id)) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Voltooid
                  </span>
                )}
              </div>
              {item.url && (
                <div className="text-sm text-gray-500">{item.url}</div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900">{item.title}</div>
                {runningTests.has(item.id) && (
                  <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {!runningTests.has(item.id) && (hasBeenTested(item) || completedTests.has(item.id)) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Voltooid
                  </span>
                )}
              </div>
              {item.url && (
                <div className="text-sm text-gray-500">{item.url}</div>
              )}
            </>
          )}
        </div>
      </td>

      {/* Actions column */}
      <td className="py-4 pr-6 align-top w-16 relative">
        <div className="flex items-center gap-2 justify-end">
          {/* Link naar detail pagina */}
          <Link
            href={`/admin/projects/${project.id}/sample/${item.id}`}
            className="sample-link-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Bekijk details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          {/* 3-puntjes menu */}
          <button
            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
            className="sample-menu-button p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {openMenuId === item.id && (
            <div className="sample-context-menu absolute right-0 top-8 z-10 w-56 rounded-lg shadow-lg border border-gray-200 py-1">
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  openItemModal(item);
                }}
                className="sample-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bewerken
              </button>
              {item.url && (
                <>
                  <button
                    onClick={() => handleRunTests(item.id, item.url)}
                    disabled={runningTests.has(item.id)}
                    className="sample-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-3 disabled:opacity-50"
                  >
                    {runningTests.has(item.id) ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Tests draaien...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Run Tests
                      </>
                    )}
                  </button>

                  <div className="my-1 border-t border-gray-200"></div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDebugMode(!debugMode);
                    }}
                    className="sample-menu-item w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Debug Mode
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors ${debugMode ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${debugMode ? 'translate-x-4 ml-0.5' : 'ml-0.5'}`}></div>
                    </div>
                  </button>

                  {debugMode && (
                    <div className="px-4 py-2">
                      <select
                        value={selectedTest}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedTest(e.target.value);
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Selecteer een test...</option>
                        {availableTests.map(testName => (
                          <option key={testName} value={testName}>
                            {testName}
                          </option>
                        ))}
                      </select>
                      {selectedTest && (
                        <div className="mt-1 text-xs text-gray-500">
                          Test: {selectedTest}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="my-1 border-t border-gray-200"></div>

              <button
                onClick={() => {
                  setOpenMenuId(null);
                  handleDelete(item.id);
                }}
                className="sample-menu-item-delete w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Verwijderen
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}