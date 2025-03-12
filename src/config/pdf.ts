import { version } from 'pdfjs-dist';

export const PDF_CONFIG = {
  worker: {
    workerSrc: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
  },
  viewer: {
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/standard_fonts/`
  }
} as const; 