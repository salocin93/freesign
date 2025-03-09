import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="max-w-full"
      >
        <Page 
          pageNumber={pageNumber} 
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="shadow-lg"
        />
      </Document>
      {numPages && (
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => setPageNumber(page => Math.max(1, page - 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <p>
            Page {pageNumber} of {numPages}
          </p>
          <button
            onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 