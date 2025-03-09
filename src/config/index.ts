export const config = {
  isDev: import.meta.env.DEV,
  testDocument: {
    enabled: import.meta.env.DEV,
    pdfPath: 'test/sample.pdf',
    recipientEmail: 'test@example.com'
  }
}; 