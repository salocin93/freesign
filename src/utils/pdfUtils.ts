import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Initialize PDFjs worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function loadPdfDocument(url: string) {
  try {
    const loadingTask = pdfjs.getDocument(url);
    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
}

export async function renderPage(pdf: pdfjs.PDFDocumentProxy, pageNumber: number, scale = 1.0) {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
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
    
    return {
      canvas,
      width: viewport.width,
      height: viewport.height,
      scale
    };
  } catch (error) {
    console.error('Error rendering page:', error);
    throw error;
  }
}

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

export function getDataUrlFromCanvas(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

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
