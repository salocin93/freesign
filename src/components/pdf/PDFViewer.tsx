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
import { PDF_CONFIG } from '@/config/pdf';

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
}

export function PDFViewer({ 
  url, 
  signingElements, 
  onElementClick,
  onAddElement,
  activeElementType
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeElementType || !onAddElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onAddElement(activeElementType, {
      x,
      y,
      pageIndex: pageNumber - 1,
    });
  };

  return (
    <div className="relative">
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
      >
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
              className="px-2 py-1 text-sm border rounded"
            >
              -
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
              className="px-2 py-1 text-sm border rounded"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber <= 1}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
              disabled={pageNumber >= numPages}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="relative">
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="pdf-page"
          />
          <div 
            className="absolute top-0 left-0 w-full h-full"
            onClick={handlePageClick}
          >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onElementClick?.(element.id);
                  }}
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
    </div>
  );
} 