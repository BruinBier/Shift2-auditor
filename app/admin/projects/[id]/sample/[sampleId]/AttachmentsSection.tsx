'use client';

import { useState } from 'react';

interface Attachment {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  type: 'screenshot' | 'upload';
}

interface AttachmentsSectionProps {
  sampleItemId: string;
  screenshotUrl?: string;
  screenshotAlt?: string;
}

export default function AttachmentsSection({ sampleItemId, screenshotUrl, screenshotAlt }: AttachmentsSectionProps) {
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Build attachments list with screenshot as first item
  const attachments: Attachment[] = [];

  if (screenshotUrl) {
    attachments.push({
      id: 'screenshot',
      name: screenshotAlt || 'Screenshot',
      url: screenshotUrl,
      createdAt: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' om ' + new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      type: 'screenshot'
    });
  }

  const handleEditClick = (attachment: Attachment) => {
    setEditingAttachment(attachment);
    setAttachmentName(attachment.name);
  };

  const handleCloseModal = () => {
    setEditingAttachment(null);
    setAttachmentName('');
  };

  const handleSave = async () => {
    if (!editingAttachment) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/sample-items/${sampleItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotAlt: attachmentName
        }),
      });

      if (response.ok) {
        // Reload the page to show updated alt text
        window.location.reload();
      } else {
        console.error('Failed to save attachment');
        alert('Er is iets misgegaan bij het opslaan. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Error saving attachment:', error);
      alert('Er is iets misgegaan bij het opslaan. Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
      handleCloseModal();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Bijlagen</h3>
          <button className="new-project-button flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-green-500 bg-white hover:bg-gray-50 transition-colors">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Upload bestand
          </button>
        </div>

        {/* Attachment list */}
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 truncate">{attachment.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{attachment.createdAt}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEditClick(attachment)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button className="p-1.5 text-red-400 hover:text-red-600 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {attachments.length === 0 && (
            <div className="text-center py-6 text-sm text-gray-500">
              Nog geen bijlagen
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bijlage bewerken</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {editingAttachment.url.endsWith('.pdf') ? (
                  <div className="aspect-[4/3] flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={editingAttachment.url}
                    alt={editingAttachment.name}
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                )}
              </div>

              {/* Input Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Omschrijving of tekstalternatief
                </label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Voer een omschrijving in"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="modal-save-button w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}