import * as pdfjsLib from 'pdfjs-dist';
// Import the worker directly as a URL
import PDFWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const PDF_CONFIG = {
  worker: {
    workerSrc: PDFWorker
  },
  viewer: {
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
  }
} as const; 