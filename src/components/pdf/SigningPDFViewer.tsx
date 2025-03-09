import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface SigningPDFViewerProps {
  url: string;
}

export function SigningPDFViewer({ url }: SigningPDFViewerProps) {
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