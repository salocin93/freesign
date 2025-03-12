declare module '*?worker' {
  const workerConstructor: any;
  export default workerConstructor;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
} 