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
import { SigningElement, Recipient } from '@/utils/types';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface SigningPDFViewerProps {
  /** URL of the PDF document to display */
  url: string;
  signingElements: SigningElement[];
  recipients: Recipient[];
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
  },
  page: {
    position: 'relative' as const,
    marginBottom: '20px',
  },
  signingElement: {
    position: 'absolute' as const,
    border: '1px solid',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
  },
};

export function SigningPDFViewer({ url, signingElements, recipients }: SigningPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Received PDF URL:', url); // <--- DEBUG URL HERE
    setLoading(true);
    setError(null);
    setNumPages(0);
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully, total pages:', numPages);
    setNumPages(numPages);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        Error loading PDF: {error.message}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Document
        file={{ url }}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(err) => {
          console.error('Error loading PDF:', err); // <--- Log exact PDF.js error
          setError(err);
          setLoading(false);
        }}
        className="flex flex-col items-center"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} style={styles.page}>
            <Page
              pageNumber={index + 1}
              width={800}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
