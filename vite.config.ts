import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["c16c3d7e-d345-466b-ad13-1ccb13df0584.lovableproject.com"],
    proxy: {
      '/api/send-signature-request': {
        target: process.env.SUPABASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/send-signature-request/, '/functions/v1/send-signature-request'),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          'vendor-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          'vendor-icons': ['lucide-react'],
          'pdfjs': ['pdfjs-dist', 'react-pdf'],
          'pdf.worker': ['pdfjs-dist/build/pdf.worker.min.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'react-pdf',
      'pdfjs-dist/build/pdf.worker.min.js'
    ],
    exclude: [
      'pdfjs-dist/web/pdf_viewer.js'
    ]
  },
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.mjs']
}));
