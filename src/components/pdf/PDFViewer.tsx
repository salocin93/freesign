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

import { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { SigningElement } from '@/utils/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, X } from 'lucide-react';
import { PDF_CONFIG } from '@/config/pdf';

// Add styles for PDF viewer
const styles = {
  container: {
    position: 'relative' as const,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    padding: '1rem',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  pdfContainer: {
    position: 'relative' as const,
    display: 'flex',
    justifyContent: 'center',
  },
  pageContainer: {
    position: 'relative' as const,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
    zIndex: 10,
    pointerEvents: 'auto' as const,
  },
  element: {
    position: 'absolute' as const,
    cursor: 'pointer',
    borderRadius: '0.5rem',
    border: '2px solid #3b82f6',
    backgroundColor: 'rgba(239, 246, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'auto' as const,
  },
  deleteButton: {
    position: 'absolute' as const,
    top: '-8px',
    right: '-8px',
    backgroundColor: 'white',
    borderRadius: '9999px',
    padding: '4px',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  deleteButtonVisible: {
    opacity: 1,
  },
};

interface PDFViewerProps {
  /** URL of the PDF document to display */
  url: string;
  /** Array of signing elements to overlay on the PDF */
  signingElements: SigningElement[];
  /** Callback function when a signing element is clicked */
  onElementClick?: (elementId: string) => void;
  /** Callback function when clicking on the document to add a new element */
  onAddElement?: (type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void;
  /** The currently active element type to add */
  activeElementType?: SigningElement['type'] | null;
  /** Callback function when a signing element is removed */
  onRemoveElement?: (elementId: string) => void;
  /** The currently selected recipient ID */
  selectedRecipientId?: string | null;
}

export function PDFViewer({ 
  url, 
  signingElements, 
  onElementClick,
  onAddElement,
  activeElementType,
  onRemoveElement,
  selectedRecipientId
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeElementType || !onAddElement) {
      console.log('Cannot add element:', { activeElementType, hasOnAddElement: !!onAddElement });
      return;
    }

    if (!selectedRecipientId) {
      alert('Please select a recipient before adding signing elements');
      return;
    }

    const pageElement = pageRef.current;
    if (!pageElement) {
      console.log('No page element found');
      return;
    }

    const rect = pageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Click position:', {
      clientX: e.clientX,
      clientY: e.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      x,
      y,
      pageIndex: pageNumber - 1,
      activeElementType
    });

    onAddElement(activeElementType, {
      x,
      y,
      pageIndex: pageNumber - 1,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          >
            -
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages}
            className="px-2 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>

      <div style={styles.pdfContainer}>
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          error={
            <div className="flex items-center justify-center p-8">
              <p className="text-red-500">Failed to load PDF document</p>
            </div>
          }
          className="pdf-document"
          options={{
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          }}
        >
          <div style={styles.pageContainer} ref={pageRef}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="pdf-page"
            />
            <div 
              style={styles.overlay}
              onClick={handlePageClick}
            >
              {signingElements
                .filter(element => element.position.pageIndex === pageNumber - 1)
                .map((element) => (
                  <div
                    key={element.id}
                    style={{
                      ...styles.element,
                      left: `${element.position.x}px`,
                      top: `${element.position.y}px`,
                      width: `${element.size.width}px`,
                      height: `${element.size.height}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onElementClick?.(element.id);
                    }}
                    onMouseEnter={() => setHoveredElementId(element.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
                  >
                    {onRemoveElement && (
                      <button
                        style={{
                          ...styles.deleteButton,
                          ...(hoveredElementId === element.id ? styles.deleteButtonVisible : {})
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveElement(element.id);
                        }}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                    <div className="text-xs text-blue-500 font-medium mb-1">
                      {element.assignedTo || 'Unassigned'}
                    </div>
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
      </div>
    </div>
  );
} 