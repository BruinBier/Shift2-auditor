'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'md-editor-rt/lib/style.css';

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

interface FindingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (finding: FindingFormData, findingId?: string, sampleItemIds?: string[]) => Promise<void>;
  criterionId: string;
  criterionCode: string;
  allCriteria: any[];
  sampleItems: any[]; // List of sample items for the project
  editingFinding?: any;
  quickFindingId?: string; // ID of the quick finding this was based on
  onQuickFindingSync?: () => void; // Callback after successful sync
}

export interface FindingFormData {
  criterionId: string;
  description: string;
  advice: string;
  status: string;
  /** 'bevinding' (afkeuring) of 'opmerking' (geen WCAG-fout, wel het melden waard) */
  type: string;
  responsibility: string;
  impact: string;
}

interface Attachment {
  file: File;
  caption: string;
}

export default function FindingDialog({ isOpen, onClose, onSave, criterionId, criterionCode, allCriteria, sampleItems, editingFinding, quickFindingId, onQuickFindingSync }: FindingDialogProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'steekproef'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedSampleItemIds, setSelectedSampleItemIds] = useState<Set<string>>(new Set());
  const [showConceptTooltip, setShowConceptTooltip] = useState(false);
  const [showOpgelostTooltip, setShowOpgelostTooltip] = useState(false);
  const [showGecontroleerdTooltip, setShowGecontroleerdTooltip] = useState(false);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [editorsReady, setEditorsReady] = useState(false);
  const [formData, setFormData] = useState<FindingFormData>({
    criterionId: criterionId,
    description: '',
    advice: '',
    status: 'open',
    type: 'bevinding',
    responsibility: 'redacteur',
    impact: 'klein',
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form with editing finding data
  useEffect(() => {
    if (editingFinding) {
      console.log('[FindingDialog] Loading editing finding:', {
        id: editingFinding.id,
        description: editingFinding.description,
        advice: editingFinding.advice,
        descriptionLength: editingFinding.description?.length || 0,
        adviceLength: editingFinding.advice?.length || 0
      });

      setFormData({
        criterionId: editingFinding.wcagCriterionId || criterionId,
        description: editingFinding.description || '',
        advice: editingFinding.advice || '',
        status: editingFinding.status || 'open',
        type: editingFinding.type ?? (editingFinding.impact == null ? 'opmerking' : 'bevinding'),
        responsibility: editingFinding.responsibility ?? 'redacteur',
        impact: editingFinding.impact ?? 'klein',
      });

      // Load existing attachments from evidence
      if (editingFinding.evidence) {
        try {
          const evidenceData = JSON.parse(editingFinding.evidence);
          if (Array.isArray(evidenceData)) {
            // For existing attachments, we'll show them but mark them as "existing"
            // We can't convert them back to File objects, so we'll handle them separately
            setAttachments([]);
          }
        } catch (e) {
          console.error('Failed to parse evidence:', e);
        }
      }

      // Load existing sample item selections from occurrences
      if (editingFinding.occurrences && Array.isArray(editingFinding.occurrences)) {
        const sampleItemIds = new Set<string>(
          editingFinding.occurrences.map((occ: any) => occ.sampleItemId)
        );
        setSelectedSampleItemIds(sampleItemIds);
      } else {
        setSelectedSampleItemIds(new Set<string>());
      }
    } else {
      // Reset form when not editing
      console.log('[FindingDialog] Resetting form (no editingFinding)');
      setFormData({
        criterionId: criterionId,
        description: '',
        advice: '',
        status: 'open',
        type: 'bevinding',
        responsibility: 'redacteur',
        impact: 'klein',
      });
      setAttachments([]);
      setSelectedSampleItemIds(new Set());
    }
  }, [editingFinding?.id, editingFinding?.description, editingFinding?.advice, criterionId]);

  // Reset editor key when dialog opens to force remount with delay
  useEffect(() => {
    if (isOpen) {
      setEditorsReady(false);
      setEditorKey(Date.now());
      // Delay to ensure DOM is ready before mounting editors
      // Use longer delay to prevent offsetTop errors
      const timer = setTimeout(() => {
        setEditorsReady(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEditorsReady(false);
    }
  }, [isOpen]);

  // Close dialog on Escape key (but first close tooltips if any are open)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // First check if any tooltip is open
        if (showConceptTooltip || showOpgelostTooltip || showGecontroleerdTooltip) {
          // Close tooltips instead of dialog
          setShowConceptTooltip(false);
          setShowOpgelostTooltip(false);
          setShowGecontroleerdTooltip(false);
          e.preventDefault();
          e.stopPropagation();
        } else {
          // Only close dialog if no tooltips are open
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, showConceptTooltip, showOpgelostTooltip, showGecontroleerdTooltip]);

  // Close dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => ({
        file,
        caption: file.name.replace(/\.[^/.]+$/, '') // Remove extension as default caption
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setAttachments(prev => prev.map((att, i) =>
      i === index ? { ...att, caption } : att
    ));
  };

  const handleSyncWithQuickFinding = async () => {
    if (!quickFindingId || (!editingFinding?.quickFindingId && !quickFindingId)) {
      alert('Deze bevinding is niet gekoppeld aan een snelle bevinding.');
      return;
    }

    const confirmSync = confirm(
      'Weet je zeker dat je de snelle bevinding wilt bijwerken met deze aanpassingen? ' +
      'Dit zal de template bijwerken voor alle toekomstige projecten.'
    );

    if (!confirmSync) return;

    setIsSyncing(true);
    try {
      const idToSync = editingFinding?.quickFindingId || quickFindingId;

      const response = await fetch(`/api/quick-findings/${idToSync}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          advice: formData.advice,
          status: formData.status,
          impact: formData.impact,
          responsibility: formData.responsibility,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with quick finding');
      }

      alert('Snelle bevinding succesvol gesynchroniseerd!');

      // Call callback to reload quick findings in parent component
      if (onQuickFindingSync) {
        onQuickFindingSync();
      }
    } catch (error) {
      console.error('Error syncing with quick finding:', error);
      alert('Er is een fout opgetreden bij het synchroniseren met de snelle bevinding.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.description || formData.description.trim() === '') {
      alert('Beschrijving is verplicht');
      return;
    }
    if (!formData.advice || formData.advice.trim() === '') {
      alert('Advies is verplicht');
      return;
    }

    setIsSaving(true);
    try {
      let evidenceData = [];

      // If editing and no new attachments, keep existing evidence
      if (editingFinding && attachments.length === 0 && editingFinding.evidence) {
        try {
          evidenceData = JSON.parse(editingFinding.evidence);
        } catch (e) {
          console.error('Failed to parse existing evidence:', e);
        }
      }

      // Upload files if there are new attachments
      if (attachments.length > 0) {
        const formDataUpload = new FormData();
        attachments.forEach(att => {
          formDataUpload.append('files', att.file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }

        const uploadResult = await uploadResponse.json();

        // Combine upload result with captions
        const newEvidence = uploadResult.files.map((file: any, index: number) => ({
          filename: file.filename,
          url: file.url,
          caption: attachments[index].caption,
          size: file.size,
          type: file.type
        }));

        // If editing, append to existing evidence
        if (editingFinding && editingFinding.evidence) {
          try {
            const existingEvidence = JSON.parse(editingFinding.evidence);
            evidenceData = [...existingEvidence, ...newEvidence];
          } catch (e) {
            evidenceData = newEvidence;
          }
        } else {
          evidenceData = newEvidence;
        }
      }

      // Bij een opmerking blijven impact en verantwoordelijkheid leeg: die horen
      // bij een afkeuring. Het formulier schakelt die velden dan ook uit.
      const isOpmerking = formData.type === 'opmerking';
      const findingDataWithEvidence: any = {
        criterionId: formData.criterionId,
        description: formData.description,
        advice: formData.advice,
        status: formData.status,
        type: formData.type,
        evidence: evidenceData.length > 0 ? JSON.stringify(evidenceData) : null,
        responsibility: isOpmerking ? null : formData.responsibility,
        impact: isOpmerking ? null : formData.impact,
      };

      await onSave(findingDataWithEvidence, editingFinding?.id, Array.from(selectedSampleItemIds));

      // Note: onClose() is not called here because handleSaveFinding in FindingsManagement
      // redirects the page using window.location.href, which will close the dialog automatically
      // by replacing the entire page. Calling onClose() here would cause a race condition.
    } catch (error) {
      console.error('Error saving finding:', error);
      // De melding van de server bevat bij schrijfregel-fouten per regel wat
      // er aangepast moet worden; die is bruikbaarder dan een algemene tekst.
      const melding = error instanceof Error && error.message ? error.message : null;
      alert(melding ?? 'Er is een fout opgetreden bij het opslaan van de bevinding.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={dialogRef} className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingFinding?.id ? (
              `Bevinding (SC ${editingFinding.wcagCriterion?.code || criterionCode})`
            ) : (
              'Nieuwe bevinding'
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('steekproef')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'steekproef'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Steekproef ({selectedSampleItemIds.size}/{sampleItems?.length || 0})
            </button>
          </div>

          {/* Sync button - only show if this finding is linked to a quick finding */}
          {(quickFindingId || editingFinding?.quickFindingId) && (
            <button
              type="button"
              onClick={handleSyncWithQuickFinding}
              disabled={isSyncing}
              className="py-2 px-4 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSyncing ? 'Synchroniseren...' : 'Synchroniseer met snelle bevinding'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Criterion */}
              <div>
                {/* Existing attachments (when editing) */}
                {editingFinding && editingFinding.evidence && (() => {
                  try {
                    const evidenceData = JSON.parse(editingFinding.evidence);
                    if (Array.isArray(evidenceData) && evidenceData.length > 0) {
                      return (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-green-600">Bijlage toegevoegd ({evidenceData.length})</span>
                          </div>
                          <div className="space-y-3">
                            {evidenceData.map((item: any, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                {item.type?.startsWith('image/') && (
                                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                                    <img
                                      src={item.url}
                                      alt={item.caption || item.filename}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  <span className="text-sm text-gray-700">{item.filename}</span>
                                </div>
                                <p className="text-xs text-gray-600"><strong>Bijschrift:</strong> {item.caption || 'Geen bijschrift'}</p>
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

                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Criterium <span className="text-red-600">vereist</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      className="new-project-button findings-button flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-green-500 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      Bijlage toevoegen
                    </button>
                    {attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Bijlage toegevoegd</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />

                {/* Attachments list */}
                {attachments.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bijlagen ({attachments.length})
                    </label>
                    <div className="space-y-3">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                          {/* Image preview */}
                          {attachment.file.type.startsWith('image/') && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                              <img
                                src={URL.createObjectURL(attachment.file)}
                                alt={attachment.caption}
                                className="w-full h-auto"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="text-sm text-gray-700">{attachment.file.name}</span>
                              <span className="text-xs text-gray-500">({Math.round(attachment.file.size / 1024)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(index)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Omschrijving van tekstalternatief
                            </label>
                            <input
                              type="text"
                              value={attachment.caption}
                              onChange={(e) => handleCaptionChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Voer bijschrift in..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <select
                    value={formData.criterionId}
                    onChange={(e) => setFormData({ ...formData, criterionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
                  >
                    {allCriteria.map((criterion: any) => (
                      <option key={criterion.id} value={criterion.id}>
                        {criterion.code} {criterion.titleNl}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving <span className="text-red-600">vereist</span>
                </label>
                {isOpen && editorsReady ? (
                  <MdEditor
                    key={`description-${editorKey}`}
                    modelValue={formData.description}
                    onChange={(content) => setFormData({ ...formData, description: content })}
                    language="en-US"
                    theme="light"
                    previewTheme="default"
                    codeTheme="github"
                    showCodeRowNumber={true}
                    sanitize={(html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
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
                    style={{ height: '300px' }}
                  />
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 h-[300px] flex items-center justify-center">
                    <span className="text-gray-500">Laden...</span>
                  </div>
                )}
              </div>

              {/* Advice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Advies</label>
                  <button type="button" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Advies genereren
                  </button>
                </div>
                {isOpen && editorsReady ? (
                  <MdEditor
                    key={`advice-${editorKey}`}
                    modelValue={formData.advice}
                    onChange={(content) => setFormData({ ...formData, advice: content })}
                    language="en-US"
                    theme="light"
                    previewTheme="default"
                    codeTheme="github"
                    showCodeRowNumber={true}
                    sanitize={(html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
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
                    style={{ height: '300px' }}
                  />
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 h-[300px] flex items-center justify-center">
                    <span className="text-gray-500">Laden...</span>
                  </div>
                )}
              </div>

              {/* Soort, Verantwoordelijkheid, Impact */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soort <span className="text-red-600">vereist</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      // Een opmerking is geen afkeuring, dus die krijgt status
                      // 'resolved' en geen impact of verantwoordelijkheid.
                      setFormData({
                        ...formData,
                        type,
                        status: type === 'opmerking' ? 'resolved' : 'open',
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bevinding">Afgekeurd</option>
                    <option value="opmerking">Opmerking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verantwoordelijkheid{' '}
                    {formData.type === 'opmerking' ? (
                      <span className="text-gray-400 font-normal">niet bij een opmerking</span>
                    ) : (
                      <span className="text-red-600">vereist</span>
                    )}
                  </label>
                  <select
                    value={formData.responsibility}
                    disabled={formData.type === 'opmerking'}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="redacteur">Redacteur</option>
                    <option value="ontwikkelaar">Ontwikkelaar</option>
                    <option value="ontwerper">Ontwerper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impact{' '}
                    {formData.type === 'opmerking' ? (
                      <span className="text-gray-400 font-normal">niet bij een opmerking</span>
                    ) : (
                      <span className="text-red-600">vereist</span>
                    )}
                  </label>
                  <select
                    value={formData.impact}
                    disabled={formData.type === 'opmerking'}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="klein">Klein</option>
                    <option value="matig">Matig</option>
                    <option value="serieus">Serieus</option>
                    <option value="kritiek">Kritiek</option>
                  </select>
                </div>
              </div>

              {/* Toggle Switches: Concept, Opgelost, Gecontroleerd */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Concept</span>
                  </label>
                  <button
                    type="button"
                    className="relative"
                    title="Meer informatie"
                    onClick={() => setShowConceptTooltip(!showConceptTooltip)}
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showConceptTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Zet concept aan om deze bevinding te verbergen in het publieke rapport. Voor ingelogde gebruikers blijft de bevinding wel zichtbaar.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Opgelost</span>
                  </label>
                  <button
                    type="button"
                    className="relative"
                    title="Meer informatie"
                    onClick={() => setShowOpgelostTooltip(!showOpgelostTooltip)}
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showOpgelostTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Markeer de bevinding als opgelost als het probleem niet meer aanwezig is.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-block w-10 h-5">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                    <span className="text-sm text-gray-700">Gecontroleerd</span>
                  </label>
                  <button
                    type="button"
                    className="relative"
                    title="Meer informatie"
                    onClick={() => setShowGecontroleerdTooltip(!showGecontroleerdTooltip)}
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showGecontroleerdTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Markeer als gecontroleerd wanneer je klaar bent met het controleren van deze bevinding.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'steekproef' && (
            <div className="space-y-4">
              {/* Action buttons */}
              {sampleItems && sampleItems.length > 0 && (
                <div className="flex items-center gap-3 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      const pageIds = sampleItems
                        .filter((item: any) => item.sampleType !== 'pdf')
                        .map((item: any) => item.id);
                      setSelectedSampleItemIds(new Set(pageIds));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Selecteer alle pagina's
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pdfIds = sampleItems
                        .filter((item: any) => item.sampleType === 'pdf')
                        .map((item: any) => item.id);
                      setSelectedSampleItemIds(new Set(pdfIds));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Selecteer alle PDF's
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSampleItemIds(new Set())}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Deselecteer alles
                  </button>
                </div>
              )}

              {sampleItems && sampleItems.length > 0 ? (
                <div className="space-y-2">
                  {sampleItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <input
                        id={`sample-item-${item.id}`}
                        type="checkbox"
                        checked={selectedSampleItemIds.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedSampleItemIds);
                          if (e.target.checked) {
                            newSet.add(item.id);
                          } else {
                            newSet.delete(item.id);
                          }
                          setSelectedSampleItemIds(newSet);
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor={`sample-item-${item.id}`} className="flex-1 min-w-0 cursor-pointer">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.url && (
                          <div className="text-xs text-blue-600 mt-0.5 truncate">{item.url}</div>
                        )}
                      </label>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.selectionMethod && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                            {item.selectionMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Geen steekproef items beschikbaar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-start gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="modal-save-button px-6 py-2 bg-[#1f0036] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Opslaan en nieuw
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Opslaan en dupliceren
          </button>
        </div>
      </div>
    </div>
  );
}