'use client';

import { useState } from 'react';

interface CrawlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (maxPages: number) => void;
  isLoading?: boolean;
}

export default function CrawlerModal({ isOpen, onClose, onConfirm, isLoading = false }: CrawlerModalProps) {
  const [maxPages, setMaxPages] = useState<string>('20');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pages = parseInt(maxPages, 10);

    // Validatie
    if (isNaN(pages)) {
      setError('Voer een geldig getal in.');
      return;
    }

    if (pages < 10 || pages > 200) {
      setError('Voer een getal in tussen de 10 en 200.');
      return;
    }

    setError('');
    onConfirm(pages);
  };

  const handleClose = () => {
    if (!isLoading) {
      setMaxPages('20');
      setError('');
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPages(e.target.value);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Web crawler</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-2">
                Maximaal aantal pagina's
              </label>
              <input
                id="maxPages"
                type="number"
                min="10"
                max="200"
                value={maxPages}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="20"
              />
              <p className="mt-1 text-xs text-gray-500">
                Voer een getal in tussen de 10 en 200.
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6b2d8f' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Crawler draait...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Crawler initialiseren</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}