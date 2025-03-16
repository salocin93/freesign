import { pdfjs as reactPdfJs } from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import { PDF_CONFIG } from '@/config/pdf';

// Initialize both pdfjs-dist and react-pdf to use the same worker
if (typeof window !== 'undefined') {
  console.log('Initializing PDF.js worker with version:', pdfjs.version);
  // Set worker for pdfjs-dist
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_CONFIG.worker.workerSrc;
  // Set worker for react-pdf
  reactPdfJs.GlobalWorkerOptions.workerSrc = PDF_CONFIG.worker.workerSrc;
} 