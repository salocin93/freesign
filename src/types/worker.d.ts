declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module 'pdfjs-dist/build/pdf.worker.min.js?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
} 