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
import { X, Loader2 } from 'lucide-react';
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
  deleteButton: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '2px',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  deleteButtonVisible: {
    opacity: 1,
  },
};

export function SigningPDFViewer({ url, signingElements, recipients }: SigningPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNumPages(0);
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
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
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(err) => {
          console.error('Error loading document:', err);
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
            <div className="absolute inset-0">
              {signingElements
                .filter(element => element.position.pageIndex === index)
                .map((element) => {
                  const recipient = recipients.find(r => r.id === element.recipient_id);
                  const recipientColor = recipient ? 
                    (recipients.findIndex(r => r.id === recipient.id) === 0 ? '#3b82f6' : 
                     recipients.findIndex(r => r.id === recipient.id) === 1 ? '#22c55e' : 
                     recipients.findIndex(r => r.id === recipient.id) === 2 ? '#ef4444' : 
                     `hsl(${(recipients.findIndex(r => r.id === recipient.id) * 360) / recipients.length}, 70%, 50%)`) : '#666';

                  return (
                    <div
                      key={element.id}
                      style={{
                        ...styles.signingElement,
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.size.width}px`,
                        height: `${element.size.height}px`,
                        borderColor: recipientColor,
                      }}
                      onMouseEnter={() => setHoveredElementId(element.id)}
                      onMouseLeave={() => setHoveredElementId(null)}
                    >
                      <div 
                        className="flex items-center justify-between px-2 py-1 border-b"
                        style={{ backgroundColor: `${recipientColor}20`, borderColor: recipientColor }}
                      >
                        <span className="text-xs font-medium">{element.type}</span>
                        <span className="text-xs text-muted-foreground">{recipient?.name || 'Unassigned'}</span>
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
          </div>
        ))}
      </Document>
    </div>
  );
} 