'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TurndownService from 'turndown';
import { marked } from 'marked';
import 'md-editor-rt/lib/style.css';

const MdEditor = dynamic(() => import('md-editor-rt').then(mod => mod.MdEditor), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4">Laden...</div>
});

// Initialize turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

interface ExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (explanation: string) => void;
  criterionCode: string;
  criterionTitle: string;
  initialExplanation: string;
}

export default function ExplanationDialog({
  isOpen,
  onClose,
  onSave,
  criterionCode,
  criterionTitle,
  initialExplanation,
}: ExplanationDialogProps) {
  const [explanation, setExplanation] = useState(initialExplanation || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when dialog opens or initial explanation changes
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened with initial explanation:', initialExplanation);

      // Check if the content is HTML (contains HTML tags)
      const isHTML = initialExplanation && /<[^>]+>/.test(initialExplanation);

      if (isHTML) {
        // Convert HTML to Markdown
        console.log('Converting HTML to Markdown');
        const markdown = turndownService.turndown(initialExplanation);
        console.log('Converted Markdown:', markdown);
        setExplanation(markdown);
      } else {
        // It's already Markdown or plain text
        setExplanation(initialExplanation || '');
      }
    }
  }, [isOpen, initialExplanation]);

  const handleSave = async () => {
    console.log('Saving explanation (Markdown):', explanation);
    setIsSaving(true);
    try {
      // Convert Markdown to HTML before saving
      const html = marked(explanation) as string;
      console.log('Converted to HTML:', html);
      await onSave(html);
      console.log('Explanation saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving explanation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to initial value on close without saving
    setExplanation(initialExplanation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Toelichting bewerken
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {criterionCode} {criterionTitle}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toelichting
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Deze toelichting wordt getoond in het rapport onder het resultaat van dit criterium.
              </p>
              <MdEditor
                modelValue={explanation}
                onChange={(content) => {
                  console.log('Editor content changed:', content);
                  setExplanation(content);
                }}
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Opslaan...
                </>
              ) : (
                'Opslaan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}