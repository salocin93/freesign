import * as pdfjsLib from 'pdfjs-dist';

export const PDF_CONFIG = {
  worker: {
    workerSrc: 'pdfjs-dist/build/pdf.worker.entry'
  },
  viewer: {
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
  }
} as const; 