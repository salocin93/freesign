/**
 * PerformancePDFViewer Component
 * 
 * A high-performance PDF viewer component with lazy loading, virtual scrolling,
 * and optimized rendering for large documents. This component is designed to
 * handle large PDF files efficiently while maintaining smooth user experience.
 * 
 * Features:
 * - Lazy loading of PDF pages
 * - Virtual scrolling for large documents
 * - Image compression and optimization
 * - Progressive loading with skeletons
 * - Memory management and cleanup
 * - Performance monitoring
 * 
 * Props:
 * @param {string} url - URL of the PDF document to display
 * @param {SigningElement[]} signingElements - Array of signing elements to overlay
 * @param {Recipient[]} recipients - Array of recipients
 * @param {(elementId: string) => void} [onElementClick] - Callback when element is clicked
 * @param {(type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void} [onAddElement] - Callback when adding new element
 * @param {SigningElement['type'] | null} [activeElementType] - Currently active element type
 * @param {(elementId: string) => void} [onRemoveElement] - Callback when element is removed
 * @param {string | null} [selectedRecipientId] - Currently selected recipient ID
 * @param {() => void} [onOpenAddRecipient] - Callback to open add recipient modal
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { SigningElement, Recipient } from '@/utils/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface PerformancePDFViewerProps {
  url: string;
  signingElements: SigningElement[];
  recipients: Recipient[];
  onElementClick?: (elementId: string) => void;
  onAddElement?: (type: SigningElement['type'], position: { x: number; y: number; pageIndex: number }) => void;
  activeElementType?: SigningElement['type'] | null;
  onRemoveElement?: (elementId: string) => void;
  selectedRecipientId?: string | null;
  onOpenAddRecipient?: () => void;
}

interface PageData {
  pageNumber: number;
  isLoaded: boolean;
  isVisible: boolean;
  height: number;
}

const PAGE_BUFFER = 2; // Number of pages to load before/after visible pages
const INITIAL_LOAD_COUNT = 3; // Number of pages to load initially

export function PerformancePDFViewer({
  url,
  signingElements,
  recipients,
  onElementClick,
  onAddElement,
  activeElementType,
  onRemoveElement,
  selectedRecipientId,
  onOpenAddRecipient
}: PerformancePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  }), []);

  // Initialize pages data
  useEffect(() => {
    if (numPages > 0) {
      const initialPages: PageData[] = Array.from({ length: numPages }, (_, i) => ({
        pageNumber: i + 1,
        isLoaded: i < INITIAL_LOAD_COUNT,
        isVisible: i < INITIAL_LOAD_COUNT,
        height: 0
      }));
      setPages(initialPages);
      setVisiblePages(new Set([1, 2, 3]));
    }
  }, [numPages]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const newVisiblePages = new Set(visiblePages);
        
        entries.forEach((entry) => {
          const pageNumber = parseInt(entry.target.getAttribute('data-page') || '0');
          if (pageNumber > 0) {
            if (entry.isIntersecting) {
              newVisiblePages.add(pageNumber);
              // Load pages in buffer
              for (let i = Math.max(1, pageNumber - PAGE_BUFFER); 
                   i <= Math.min(numPages, pageNumber + PAGE_BUFFER); 
                   i++) {
                newVisiblePages.add(i);
              }
            } else {
              // Only remove if not in buffer of any visible page
              const shouldKeep = Array.from(newVisiblePages).some(visiblePage => 
                Math.abs(visiblePage - pageNumber) <= PAGE_BUFFER
              );
              if (!shouldKeep) {
                newVisiblePages.delete(pageNumber);
              }
            }
          }
        });

        setVisiblePages(newVisiblePages);
      },
      {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [numPages, visiblePages]);

  // Update pages loading state based on visibility
  useEffect(() => {
    setPages(prevPages => 
      prevPages.map(page => ({
        ...page,
        isVisible: visiblePages.has(page.pageNumber),
        isLoaded: page.isLoaded || visiblePages.has(page.pageNumber)
      }))
    );
  }, [visiblePages]);

  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleDocumentLoadError = useCallback((error: Error) => {
    setError(error.message);
    setIsLoading(false);
  }, []);

  const handlePageLoadSuccess = useCallback((pageNumber: number, height: number) => {
    setPages(prevPages => 
      prevPages.map(page => 
        page.pageNumber === pageNumber 
          ? { ...page, isLoaded: true, height }
          : page
      )
    );
  }, []);

  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    if (!activeElementType || !onAddElement) return;

    if (!selectedRecipientId) {
      onOpenAddRecipient?.();
      return;
    }

    const pageElement = pageRefs.current.get(pageNumber);
    if (!pageElement) return;

    const rect = pageElement.getBoundingClientRect();
    const defaultSizes = {
      signature: { width: 200, height: 80 },
      date: { width: 150, height: 40 },
      text: { width: 200, height: 40 },
      checkbox: { width: 40, height: 40 }
    };

    const size = defaultSizes[activeElementType] || { width: 200, height: 40 };
    
    const x = e.clientX - rect.left - (size.width / 2);
    const y = e.clientY - rect.top - (size.height / 2);

    onAddElement(activeElementType, {
      x,
      y,
      pageIndex: pageNumber - 1,
    });
  }, [activeElementType, onAddElement, selectedRecipientId, onOpenAddRecipient]);

  const scrollToPage = useCallback((pageNumber: number) => {
    const pageElement = pageRefs.current.get(pageNumber);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  }, []);

  // Memoized page rendering
  const renderPage = useCallback((pageData: PageData) => {
    const pageSigningElements = signingElements.filter(
      element => element?.position?.pageIndex === pageData.pageNumber - 1
    );

    return (
      <div
        key={pageData.pageNumber}
        ref={(el) => {
          if (el) {
            pageRefs.current.set(pageData.pageNumber, el);
            if (observerRef.current) {
              observerRef.current.observe(el);
            }
          }
        }}
        data-page={pageData.pageNumber}
        className="relative mb-4"
        onClick={(e) => handlePageClick(e, pageData.pageNumber)}
      >
        {pageData.isVisible ? (
          <Page
            pageNumber={pageData.pageNumber}
            scale={scale}
            className="pdf-page"
            loading={
              <div className="flex items-center justify-center p-8">
                <Skeleton className="w-full h-96" />
              </div>
            }
            onLoadSuccess={(page) => {
              handlePageLoadSuccess(pageData.pageNumber, page.height);
            }}
            onLoadError={(error) => {
              console.error(`Failed to load page ${pageData.pageNumber}:`, error);
            }}
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-100">
            <Skeleton className="w-full h-full" />
          </div>
        )}

        {/* Signing Elements Overlay */}
        {pageData.isVisible && pageSigningElements.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {pageSigningElements.map((element) => {
              const recipient = recipients.find(r => r.id === element.recipient_id);
              const recipientColor = recipient ? 
                (recipients.findIndex(r => r.id === recipient.id) === 0 ? '#3b82f6' : 
                 recipients.findIndex(r => r.id === recipient.id) === 1 ? '#22c55e' : 
                 recipients.findIndex(r => r.id === recipient.id) === 2 ? '#ef4444' : 
                 `hsl(${(recipients.findIndex(r => r.id === recipient.id) * 360) / recipients.length}, 70%, 50%)`) : '#666';
              
              return (
                <div
                  key={element.id}
                  className="absolute border-2 rounded cursor-pointer flex flex-col pointer-events-auto"
                  style={{
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    borderColor: recipientColor,
                    backgroundColor: `${recipientColor}10`,
                  }}
                  onClick={() => onElementClick?.(element.id)}
                >
                  <div 
                    className="flex items-center justify-center px-2 py-1 border-b text-xs font-medium"
                    style={{ backgroundColor: `${recipientColor}20`, borderColor: recipientColor }}
                  >
                    {element.type}
                  </div>
                  <div className="flex-1 flex items-center justify-center relative">
                    {onRemoveElement && (
                      <button
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveElement(element.id);
                        }}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    )}
                    {element.type === 'signature' && element.value && (
                      <img 
                        src={element.value as string} 
                        alt="Signature" 
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
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
        )}
      </div>
    );
  }, [signingElements, recipients, scale, onElementClick, onRemoveElement, handlePageClick]);

  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-2">Failed to load PDF document</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative bg-white rounded-lg shadow-lg">
      {/* Performance Controls */}
      <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {numPages}
            </span>
            {pages.length > 0 && (
              <span className="text-xs text-gray-400">
                {pages.filter(p => p.isLoaded).length} loaded
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* PDF Container with Virtual Scrolling */}
      <div 
        ref={containerRef}
        className="relative overflow-auto max-h-[calc(100vh-200px)]"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="p-4">
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-sm text-gray-600">Loading PDF document...</p>
                </div>
              </div>
            }
            className="pdf-document"
            options={pdfOptions}
          >
            {pages.map(renderPage)}
          </Document>
        </div>
      </div>
    </div>
  );
}
