import { pdfjs as reactPdfJs } from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import { PDF_CONFIG } from '@/config/pdf';

// Initialize both pdfjs-dist and react-pdf to use the same worker
if (typeof window !== 'undefined') {
  console.log('Initializing PDF.js worker with version:', pdfjs.version);
  
  const workerConfig = {
    workerSrc: PDF_CONFIG.worker.workerSrc,
    workerPort: new Worker(PDF_CONFIG.worker.workerSrc, { type: 'module' })
  };
  
  // Set worker for pdfjs-dist
  Object.assign(pdfjs.GlobalWorkerOptions, workerConfig);
  // Set worker for react-pdf
  Object.assign(reactPdfJs.GlobalWorkerOptions, workerConfig);
} 