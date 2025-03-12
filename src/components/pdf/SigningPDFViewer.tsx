/**
 * SigningPDFViewer Component
 * 
 * 
 * A simplified PDF viewer component specifically designed for the document signing flow.
 * This component provides a clean interface for users to view documents they need to sign,
 * without the ability to add or modify signing elements.
 * 
 * Features:
 * - PDF document rendering with page navigation
 * - Error handling and loading states
 * - Optimized for document signing workflow
 * 
 * @component
 * @example
 * ```tsx
 * <SigningPDFViewer url="path/to/document.pdf" />
 * ```
 */

import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2 } from 'lucide-react';
import { PDF_CONFIG } from '@/config/pdf';

interface SigningPDFViewerProps {
  /** URL of the PDF document to display */
  url: string;
}

export function SigningPDFViewer({ url }: SigningPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset state when URL changes
  useEffect(() => {
    console.log('URL changed in SigningPDFViewer:', url);
    setLoading(true);
    setError(null);
    setNumPages(0);
    setPageNumber(1);
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setLoading(false);
    setError(null);
    setNumPages(numPages);
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err, { url });
    setLoading(false);
    setError(err);
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No document URL provided</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <p className="text-red-500 mb-2">Failed to load PDF</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
        className="flex justify-center"
        options={PDF_CONFIG.viewer}
      >
        <div className="relative">
          <Page
            key={`${url}-${pageNumber}`}
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
            loading={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
            onLoadError={(err) => {
              console.error('Error loading page:', err);
              setError(err);
            }}
          />
        </div>
      </Document>
      {numPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setPageNumber(page => Math.max(1, page - 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 