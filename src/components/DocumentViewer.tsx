import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { loadPdfDocument, renderPage } from '@/utils/pdfUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DocumentViewerProps {
  documentUrl: string;
  children?: React.ReactNode;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentUrl, children }) => {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageError, setPageError] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (!documentUrl) return;

    const loadPdf = async () => {
      try {
        // If the URL is a blob URL, fetch it first
        let pdfUrl = documentUrl;
        if (documentUrl.startsWith('blob:')) {
          const response = await fetch(documentUrl);
          const blob = await response.blob();
          pdfUrl = URL.createObjectURL(blob);
        }

        const pdfDoc = await loadPdfDocument(pdfUrl);
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1); // Reset to first page when loading a new document
      } catch (error) {
        console.error('Error loading PDF document:', error);
        toast.error('Failed to load document');
        setPageError(true);
      }
    };

    loadPdf();

    return () => {
      if (pdf) {
        pdf.destroy().catch(console.error);
        setPdf(null);
      }
    };
  }, [documentUrl]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderCurrentPage = async () => {
      setPageRendering(true);
      setPageError(false);

      try {
        // Clear previous content
        while (canvasRef.current && canvasRef.current.firstChild) {
          canvasRef.current.removeChild(canvasRef.current.firstChild);
        }

        const { canvas } = await renderPage(pdf, currentPage, scale);
        
        if (canvasRef.current) {
          canvasRef.current.appendChild(canvas);
        }
      } catch (error) {
        console.error('Error rendering page:', error);
        setPageError(true);
        toast.error('Failed to render page');
      } finally {
        setPageRendering(false);
      }
    };

    renderCurrentPage();
  }, [pdf, currentPage, scale]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5));
  };

  if (!documentUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] border rounded-lg bg-muted/30">
        <p className="text-muted-foreground">No document selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" ref={containerRef}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1 || pageRendering}
            className="transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages || '?'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || pageRendering}
            className="transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || pageRendering}
            className="transition-all duration-200"
          >
            -
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 2.0 || pageRendering}
            className="transition-all duration-200"
          >
            +
          </Button>
        </div>
      </div>

      <div className="relative overflow-auto border rounded-lg bg-white shadow-sm">
        {pageRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {pageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-destructive flex flex-col items-center">
              <p>Error loading page</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Reload page
              </Button>
            </div>
          </div>
        )}

        <div className="relative min-h-[500px]">
          <div ref={canvasRef} className="pdf-page transition-all duration-300"></div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
