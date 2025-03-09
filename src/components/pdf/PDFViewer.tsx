import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { SigningElement } from '@/utils/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
  signingElements: SigningElement[];
  onElementClick?: (elementId: string) => void;
}

export function PDFViewer({ url, signingElements, onElementClick }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="relative">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex justify-center"
      >
        <div className="relative">
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
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