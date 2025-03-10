import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { SigningElement } from '@/utils/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2 } from 'lucide-react';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';

// Configure PDF.js worker
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface PDFViewerProps {
  url: string;
  signingElements: SigningElement[];
  onElementClick?: (elementId: string) => void;
}

export function PDFViewer({ url, signingElements, onElementClick }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <p className="text-red-500 mb-2">Failed to load PDF</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        }}
      >
        <div className="relative">
          <Page
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
            {signingElements.map((element) => (
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