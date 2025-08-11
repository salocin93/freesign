/**
 * MobilePDFViewer Component
 * 
 * A mobile-optimized PDF viewer component with touch support, gesture controls,
 * and mobile-specific UI elements. This component provides a better experience
 * for mobile devices with touch-friendly controls and responsive design.
 * 
 * Features:
 * - Touch-friendly zoom and pan controls
 * - Mobile-optimized navigation
 * - Gesture support for zoom/pan
 * - Responsive layout for small screens
 * - Touch-friendly signing element interaction
 * - Mobile-specific error handling
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

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import { SigningElement, Recipient } from '@/utils/types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, X, ZoomIn, ZoomOut, RotateCcw, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface MobilePDFViewerProps {
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

export function MobilePDFViewer({
  url,
  signingElements,
  recipients,
  onElementClick,
  onAddElement,
  activeElementType,
  onRemoveElement,
  selectedRecipientId,
  onOpenAddRecipient
}: MobilePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setShowControls(true);
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  }, [panOffset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      setPanOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeElementType || !onAddElement) return;

    if (!selectedRecipientId) {
      onOpenAddRecipient?.();
      return;
    }

    const pageElement = pageRef.current;
    if (!pageElement) return;

    const rect = pageElement.getBoundingClientRect();
    const defaultSizes = {
      signature: { width: 150, height: 60 },
      date: { width: 120, height: 30 },
      text: { width: 150, height: 30 },
      checkbox: { width: 30, height: 30 }
    };

    const size = defaultSizes[activeElementType] || { width: 150, height: 30 };
    
    const x = e.clientX - rect.left - (size.width / 2);
    const y = e.clientY - rect.top - (size.height / 2);

    onAddElement(activeElementType, {
      x,
      y,
      pageIndex: pageNumber - 1,
    });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setShowControls(true)}
    >
      {/* Mobile Controls Overlay */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {pageNumber} / {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                disabled={pageNumber >= numPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateLeft}
            className="h-10 w-10 p-0 rounded-full shadow-lg"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotateRight}
            className="h-10 w-10 p-0 rounded-full shadow-lg"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="h-10 w-10 p-0 rounded-full shadow-lg"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* PDF Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <Document
          file={url}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          error={
            <Card className="m-4">
              <CardContent className="p-6 text-center">
                <p className="text-red-500 mb-2">Failed to load PDF document</p>
                <p className="text-sm text-gray-500">Please check your connection and try again</p>
              </CardContent>
            </Card>
          }
          className="pdf-document"
          options={{
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          }}
        >
          <div 
            ref={pageRef}
            className="relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            onClick={handlePageClick}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="pdf-page"
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
            />
            
            {/* Signing Elements Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {signingElements
                .filter(element => element.position.pageIndex === pageNumber - 1)
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
                      className="absolute border-2 rounded pointer-events-auto"
                      style={{
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        width: `${element.size.width}px`,
                        height: `${element.size.height}px`,
                        borderColor: recipientColor,
                        backgroundColor: `${recipientColor}10`,
                      }}
                      onClick={() => onElementClick?.(element.id)}
                      onTouchStart={() => setHoveredElementId(element.id)}
                      onTouchEnd={() => setHoveredElementId(null)}
                    >
                      <div 
                        className="flex items-center justify-center px-1 py-1 border-b text-xs font-medium"
                        style={{ backgroundColor: `${recipientColor}20`, borderColor: recipientColor }}
                      >
                        {element.type}
                      </div>
                      <div className="flex-1 flex items-center justify-center relative">
                        {onRemoveElement && hoveredElementId === element.id && (
                          <button
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveElement(element.id);
                            }}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </button>
                        )}
                        {element.type === 'signature' && element.value && (
                          <img src={element.value as string} alt="Signature" className="w-full h-full object-contain" />
                        )}
                        {element.type === 'checkbox' && (
                          <input
                            type="checkbox"
                            checked={element.value === true}
                            readOnly
                            className="w-5 h-5"
                          />
                        )}
                      </div>
                      <div 
                        className="flex items-center justify-center px-1 py-1 border-t text-xs text-muted-foreground"
                        style={{ borderColor: recipientColor }}
                      >
                        {recipient?.name || 'Unassigned'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Document>
      </div>

      {/* Zoom Slider */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-20 z-50">
          <Slider
            value={[scale]}
            onValueChange={(value) => setScale(value[0])}
            min={0.5}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
