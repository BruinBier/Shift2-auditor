'use client';

import { useState } from 'react';

interface ScreenshotViewerProps {
  src: string;
  alt: string;
}

export default function ScreenshotViewer({ src, alt }: ScreenshotViewerProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={() => setIsEnlarged(true)}
        className="cursor-pointer inline-block"
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[200px] h-auto border border-gray-200 rounded hover:opacity-80 transition-opacity"
        />
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8"
          onClick={() => setIsEnlarged(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setIsEnlarged(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}