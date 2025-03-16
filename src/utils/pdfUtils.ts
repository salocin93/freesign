/**
 * Utility functions for handling PDF documents using PDF.js library.
 * This module provides functionality for loading, rendering, and manipulating PDF files
 * in a browser environment.
 */

import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

// Initialize PDFjs worker
let workerSrcInitialized = false;

/**
 * Initializes the PDF.js worker if it hasn't been initialized yet.
 * This is required for PDF.js to function properly in a browser environment.
 * The function creates a worker blob URL and sets it as the worker source.
 */
async function initializeWorkerSrc() {
  if (!workerSrcInitialized) {
    const worker = new pdfWorker();
    pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
      new Blob(['(' + worker.toString() + ')()'], { type: 'application/javascript' })
    );
    workerSrcInitialized = true;
  }
}

/**
 * Loads a PDF document from a given URL.
 * @param url - The URL of the PDF document. Can be a direct URL or a blob URL.
 * @returns A Promise that resolves to a PDFDocumentProxy object representing the loaded PDF.
 * @throws Will throw an error if the PDF loading fails.
 */
export async function loadPdfDocument(url: string) {
  await initializeWorkerSrc();
  
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
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
}

/**
 * Renders a specific page of a PDF document to a canvas element.
 * @param pdf - The PDF document proxy object obtained from loadPdfDocument.
 * @param pageNumber - The page number to render (1-based index).
 * @param scale - The scale factor to apply when rendering the page (default: 1.0).
 * @returns A Promise that resolves to an object containing:
 *          - canvas: The rendered canvas element
 *          - width: The width of the rendered page
 *          - height: The height of the rendered page
 * @throws Will throw an error if page rendering fails.
 */
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
