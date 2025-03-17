import { pdfjs as reactPdfJs } from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import { PDF_CONFIG } from '@/config/pdf';

// Initialize both pdfjs-dist and react-pdf to use the same worker
if (typeof window !== 'undefined') {
  try {
    console.log('Initializing PDF.js worker with version:', pdfjs.version);
    
    // Set worker for pdfjs-dist
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_CONFIG.worker.workerSrc;
    
    // Set worker for react-pdf using the same worker
    reactPdfJs.GlobalWorkerOptions.workerSrc = PDF_CONFIG.worker.workerSrc;
    
    // Ensure worker is properly initialized
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      throw new Error('PDF.js worker source not properly set');
    }
    
    console.log('PDF.js worker initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
  }
} 