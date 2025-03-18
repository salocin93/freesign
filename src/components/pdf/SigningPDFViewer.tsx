/**
 * SigningPDFViewer Component
 * 
 * A simplified PDF viewer component specifically designed for the document signing flow.
 * This component provides a clean interface for users to view documents they need to sign,
 * without the ability to add or modify signing elements.
 * 
 * Features:
 * - PDF document rendering with page navigation
 * - Error handling and loading states
 * - Optimized for document signing workflow
 * - Displays signatures for completed documents
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
  /** Array of signing elements to overlay on the PDF */
  signingElements: SigningElement[];
  /** Array of recipients associated with the signing elements */
  recipients: Recipient[];
  /** Whether the document is completed (to show signatures) */
  isCompleted?: boolean;
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

export function SigningPDFViewer({ url, signingElements, recipients, isCompleted = false }: SigningPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(800); // Default width

  useEffect(() => {
    console.log('Received PDF URL:', url);
    setError(null);
    setNumPages(0);
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully, total pages:', numPages);
    setNumPages(numPages);
  }

  function onPageLoadSuccess({ width }: { width: number }) {
    setPageWidth(width);
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
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(err) => {
          console.error('Error loading PDF:', err);
          setError(err);
        }}
        loading={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
        className="flex flex-col items-center"
        options={{
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          disableStream: true,
          disableAutoFetch: true
        }}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} style={styles.page}>
            <Page
              pageNumber={index + 1}
              width={800}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            {/* Render signing elements for this page */}
            {signingElements
              .filter(element => element.position.pageIndex === index)
              .map((element) => {
                const recipient = recipients.find(r => r.id === element.recipient_id);
                const recipientColor = recipient ? 
                  (recipients.findIndex(r => r.id === recipient.id) === 0 ? '#3b82f6' : 
                   recipients.findIndex(r => r.id === recipient.id) === 1 ? '#22c55e' : 
                   recipients.findIndex(r => r.id === recipient.id) === 2 ? '#ef4444' : 
                   `hsl(${(recipients.findIndex(r => r.id === recipient.id) * 360) / recipients.length}, 70%, 50%)`) : '#666';
                
                // Calculate position relative to page width
                const scale = pageWidth / 800; // Scale factor between actual and rendered width
                const x = element.position.x * scale;
                const y = element.position.y * scale;
                const width = element.size.width * scale;
                const height = element.size.height * scale;
                
                return (
                  <div
                    key={element.id}
                    className="absolute border-2 rounded flex flex-col"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      borderColor: recipientColor,
                    }}
                  >
                    <div 
                      className="flex items-center justify-center px-2 py-1 border-b text-xs font-medium"
                      style={{ backgroundColor: `${recipientColor}20`, borderColor: recipientColor }}
                    >
                      {element.type}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      {element.type === 'signature' && element.value && (
                        <img src={element.value as string} alt="Signature" className="w-full h-full object-contain" />
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
                    <div 
                      className="flex items-center justify-center px-2 py-1 border-t text-xs text-muted-foreground"
                      style={{ borderColor: recipientColor }}
                    >
                      {recipient?.name || 'Unassigned'}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </Document>
    </div>
  );
}
