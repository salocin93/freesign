/**
 * Utility functions for handling PDF documents using PDF.js library.
 * This module provides functionality for loading, rendering, and manipulating PDF files
 * in a browser environment.
 */

import * as pdfjs from 'pdfjs-dist';

// Initialize worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString();
}

export async function loadPdfDocument(url: string) {
  try {
    let pdfUrl = url;
    
    // If the URL is a blob URL, fetch it first
    if (url.startsWith('blob:')) {
      const response = await fetch(url);
      const blob = await response.blob();
      // Create a new blob URL with the correct MIME type
      pdfUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    }

    // Create loading task with specific options
    const loadingTask = pdfjs.getDocument({
      url: pdfUrl,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`
    });

    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    // Enhanced error handling
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to load PDF file. Please check your internet connection.');
    } else if (error instanceof Error && error.message.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file: The file appears to be corrupted or is not a valid PDF.');
    } else {
      console.error('Error loading PDF:', error);
      throw new Error('Failed to load PDF: An unexpected error occurred.');
    }
  }
}

export async function renderPage(pdf: pdfjs.PDFDocumentProxy, pageNumber: number, scale: number = 1.0) {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    return {
      canvas,
      width: viewport.width,
      height: viewport.height,
    };
  } catch (error) {
    console.error('Error rendering page:', error);
    throw error;
  }
}

/**
 * Calculates the dimensions of a PDF page when scaled to fit a container width.
 * @param page - The PDF page proxy object.
 * @param containerWidth - The width of the container to fit the page into.
 * @returns An object containing:
 *          - width: The calculated width of the page
 *          - height: The calculated height of the page
 *          - scale: The calculated scale factor
 */
export function calculatePageDimensions(page: pdfjs.PDFPageProxy, containerWidth: number) {
  const viewport = page.getViewport({ scale: 1 });
  const scale = containerWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  
  return {
    width: scaledViewport.width,
    height: scaledViewport.height,
    scale
  };
}

/**
 * Converts a canvas element to a data URL.
 * @param canvas - The canvas element to convert.
 * @returns A data URL string representing the canvas content as a PNG image.
 */
export function getDataUrlFromCanvas(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Generates a thumbnail image for a specific page of a PDF document.
 * @param pdf - The PDF document proxy object.
 * @param pageNumber - The page number to generate thumbnail for (default: 1).
 * @returns A Promise that resolves to a data URL string containing the thumbnail image.
 * @throws Will throw an error if thumbnail generation fails.
 */
export async function generateThumbnail(pdf: pdfjs.PDFDocumentProxy, pageNumber = 1): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 0.2 });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not create canvas context');
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  
  return canvas.toDataURL('image/png');
}
