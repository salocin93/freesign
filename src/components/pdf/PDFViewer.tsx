/**
 * PDFViewer Component
 * 
 * A PDF viewer component specifically designed for the document creation and editing flow.
 * This component allows users to view PDF documents and interact with signing elements
 * such as signature boxes, date fields, text inputs, and checkboxes.
 * 
 * Features:
 * - PDF document rendering with page navigation
 * - Interactive signing elements overlay
 * - Error handling and loading states
 * - Support for different types of signing elements (signature, date, text, checkbox)
 * 
 * @component
 * @example
 * ```tsx
 * <PDFViewer
 *   url="path/to/document.pdf"
 *   signingElements={[]}
 *   onElementClick={(elementId) => console.log(elementId)}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { SigningElement } from '@/utils/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2 } from 'lucide-react';

interface PDFViewerProps {
  /** URL of the PDF document to display */
  url: string;
  /** Array of signing elements to overlay on the PDF */
  signingElements: SigningElement[];
  /** Callback function when a signing element is clicked */
  onElementClick?: (elementId: string) => void;
}

export function PDFViewer({ url, signingElements, onElementClick }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset state when URL changes
  useEffect(() => {
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
        options={{
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`
        }}
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
          <div className="absolute top-0 left-0 w-full h-full">
            {signingElements
              .filter(element => element.position.pageIndex === pageNumber - 1)
              .map((element) => (
                <div
                  key={element.id}
                  className="absolute cursor-pointer border-2 border-blue-500 bg-blue-50 bg-opacity-30 flex items-center justify-center"
                  style={{
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                  }}
                  onClick={() => onElementClick?.(element.id)}
                >
                  {element.type === 'signature' && !element.value && (
                    <span className="text-sm text-blue-500">Click to sign</span>
                  )}
                  {element.type === 'signature' && element.value && (
                    <img src={element.value as string} alt="Signature" className="w-full h-full object-contain" />
                  )}
                  {element.type === 'date' && (
                    <span className="text-sm text-blue-500">
                      {element.value || 'Date'}
                    </span>
                  )}
                  {element.type === 'text' && (
                    <span className="text-sm text-blue-500">
                      {element.value || 'Text'}
                    </span>
                  )}
                  {element.type === 'checkbox' && (
                    <input
                      type="checkbox"
                      checked={element.value === true}
                      readOnly
                      className="w-6 h-6"
                    />
                  )}
                </div>
              ))}
          </div>
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